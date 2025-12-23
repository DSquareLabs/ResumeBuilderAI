from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from openai import OpenAI
import os

from app.database import get_db
from app.services.credits import has_credits, deduct_credit

router = APIRouter(prefix="/api", tags=["cover-letter"])
client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

class CoverLetterInput(BaseModel):
    email: str
    style: str
    resume_text: str
    job_description: str
    hiring_manager: str | None = "Hiring Manager"
    motivation: str | None = ""
    highlight: str | None = ""

@router.post("/generate-cover-letter")
def generate_cl(data: CoverLetterInput, db: Session = Depends(get_db)):
    
    if not has_credits(db, data.email):
        raise HTTPException(status_code=402, detail="No credits")

    system_prompt = f"""
    You are an expert Career Coach and Professional Writer. 
    You are generating a Cover Letter in HTML/CSS format.
    
    DESIGN RULES:
    - Return ONLY the HTML content inside a container (no <head>, <body>).
    - Embed CSS in <style> tags.
    - MATCH THE VISUAL STYLE: "{data.style}". 
      (If Harvard: clean, serif, minimal. If Tech: modern, sans-serif, accent colors. If Creative: bold headers).
    - Ensure it fits perfectly on one A4 page (@media print).
    
    CONTENT RULES:
    - Tone: Professional, confident, enthusiastic.
    - Structure:
      1. Header (Same style as resume would be)
      2. Salutation (Dear {data.hiring_manager},)
      3. The Hook: Why this company? (Integrate user's motivation: "{data.motivation}")
      4. The Pitch: Connect user's resume skills to the Job Description.
      5. The Proof: Specific achievement (Integrate: "{data.highlight}")
      6. Call to Action & Sign-off.
    """

    user_prompt = f"""
    Job Description: {data.job_description}
    Candidate Resume Data: {data.resume_text}
    
    Candidate's specific motivation: {data.motivation}
    Candidate's specific highlight: {data.highlight}
    """

    response = client.chat.completions.create(
        model="gpt-5.1", 
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )

    content = response.choices[0].message.content
    cl_html = content.replace('```html', '').replace('```', '').strip()


    deduct_credit(db, data.email)
    
    # Get remaining
    from app.models.profile import Profile
    user = db.query(Profile).filter(Profile.email == data.email).first()

    return {
        "cover_letter_html": cl_html,
        "credits_left": user.credits
    }