from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI
import os

from app.database import get_db
from app.services.credits import deduct_refine_credit, has_credits
from app.models.profile import Profile # We need this to check credits without deducting
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["refine"])

client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

class RefineRequest(BaseModel):
    html: str
    instruction: str
    email: str
    type: str = "resume" 

@router.post("/refine-resume")
def refine_resume(data: RefineRequest, db: Session = Depends(get_db)):
    # 1️⃣ Check if user HAS credits (don't deduct yet)
    # We query the user manually here or use a helper
    user = db.query(Profile).filter(Profile.email == data.email).first()
    if not user or user.credits < 0.5:
         raise HTTPException(status_code=402, detail="Insufficient credits")

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
            model="gpt-4o", # Updated model
            messages=[
                {"role": "system", "content": "You refine resumes/cover letters without changing structure."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=5000,
        )
        updated_html = response.choices[0].message.content.strip()
        updated_html = updated_html.replace('```html', '').replace('```', '').strip()
        
        # 3️⃣ SUCCESS! Now we deduct the credits.
        # We reuse the helper, or you can do it manually here to be safe.
        credits_left = deduct_refine_credit(db, data.email)

        return {
            "updated_html": updated_html,
            "credits_left": credits_left
        }

    except Exception as e:
        print(f"Refine Error: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed. No credits were deducted.")