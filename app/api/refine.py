from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI
import os
import re

from app.database import get_db
from app.dependencies import get_verified_email
from app.services.credits import (
    deduct_credit_atomic, 
    refund_credit, 
    has_credits,
    REFINE_COST,
    CHAR_LIMIT_ASK_AI_ADJUST
)
from app.models.profile import Profile
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["refine"])

client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))
CHAR_LIMIT_HTML_SAFETY = 30000

class RefineRequest(BaseModel):
    html: str
    instruction: str
    job_description: str = "" 
    current_ats_score: int = 0 
    type: str = "resume"
    

def internal_calculate_ats_mini(resume_html: str, job_desc: str) -> int:
    """
    Internal helper to calculate ATS score cheaply using GPT-4o-mini.
    """
    if not job_desc or len(job_desc) < 10:
        return 0

    # ⚠️ FIX: Do NOT use f-string with HTML because CSS curly braces {} will break it.
    prompt_intro = """
    You are a strict ATS Algorithm. 
    TASK: Calculate a match score (0-100) between the Resume and JD.
    SCORING RULES:
    1. EXTRACT keywords from JD.
    2. COUNT matches in Resume HTML.
    3. MATH: (Matches / Total Keywords) * 100.
    4. CAP at 100.
    
    OUTPUT: Return ONLY the integer number. No text.
    """
    
    # Safe concatenation
    full_prompt = prompt_intro + "\n\nRESUME HTML:\n" + resume_html[:15000] + "\n\nJOB DESCRIPTION:\n" + job_desc[:5000]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": full_prompt}],
            temperature=0.0,
            max_completion_tokens=10,
        )
        score_text = response.choices[0].message.content.strip()
        print(f"💰 ATS Calc Raw Output: {score_text}")
        # 🛡️ SAFETY: Use Regex to find the number hidden in text
        match = re.search(r'\d+', score_text)
        return int(match.group()) if match else 0
    except Exception as e:
        print(f"⚠️ ATS Calculation Failed: {e}")
        return 0

@router.post("/refine-resume")
def refine_resume(data: RefineRequest, email: str = Depends(get_verified_email), db: Session = Depends(get_db)):
    """
    Refine a resume/cover letter. Email is extracted from verified Google token.
    🔒 SECURITY: Email comes from verified JWT token, never from request body.
    """
    # ✅ VALIDATION 1: Character Limit on instruction
    if len(data.instruction) > CHAR_LIMIT_ASK_AI_ADJUST:
        raise HTTPException(
            status_code=400,
            detail=f"Your instruction exceeds {CHAR_LIMIT_ASK_AI_ADJUST} characters. Please be more concise."
        )
    
    if len(data.html) > CHAR_LIMIT_HTML_SAFETY:
        raise HTTPException(
            status_code=400,
            detail=f"Resume is too large to process ({len(data.html)} chars)."
        )
        
    # ✅ VALIDATION 2: Check if user has credits
    if not has_credits(db, email, REFINE_COST):
        raise HTTPException(
            status_code=402, 
            detail=f"Insufficient credits. You need {REFINE_COST} credits to refine."
        )

    # ✅ ATOMIC OPERATION 1: Deduct credits FIRST
    try:
        remaining_credits = deduct_credit_atomic(db, email, REFINE_COST)
    except HTTPException as e:
        raise e

    # 2️⃣ AI Prompt
    context_instruction = "You are refining a Resume."
    if data.type == "cover_letter":
        context_instruction = "You are refining a Cover Letter. Maintain the letter format, flow, and professional tone."

    prompt = f"""
    You are an expert resume editor.

    RULES:
    - You will receive HTML content.
    - DO NOT remove structure.
    - DO NOT invent content.
    - Only modify what the instruction explicitly asks.
    - Preserve formatting, tags, and layout.
    - Return FULL updated HTML only.

    CONTEXT: {context_instruction}

    INSTRUCTION:
    {data.instruction}

    CURRENT CONTENT HTML:
    {data.html}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You refine resumes/cover letters without changing structure."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=5000,
        )
        updated_html = response.choices[0].message.content.strip()
        updated_html = updated_html.replace('```html', '').replace('```', '').strip()
        
        # ✅ VALIDATION 3: Validate we got content back
        if not updated_html:
            raise ValueError("Empty response from AI")
        
        new_ats_score = data.current_ats_score
        
        if data.type == "resume" and data.job_description and len(data.job_description) > 10:
            calculated_score = internal_calculate_ats_mini(updated_html, data.job_description)
            if calculated_score > 0:
                new_ats_score = calculated_score
            else:
                print("⚠️ Calculated score was 0, keeping old score.")
        
        # ✅ SUCCESS! Credits already deducted (atomic)
        return {
            "updated_html": updated_html,
            "ats_score": new_ats_score,
            "credits_left": remaining_credits
        }

    except Exception as e:
        # ✅ REFUND: Operation failed, return credits
        refund_credit(db, email, REFINE_COST)
        print(f"Refine failed, refunding {REFINE_COST} credits. Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="AI refinement failed. Credits have been refunded."
        )