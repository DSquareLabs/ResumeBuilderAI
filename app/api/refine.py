from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from openai import OpenAI
import os

from app.database import get_db
from app.services.credits import deduct_refine_credit
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["refine"])

client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

class RefineRequest(BaseModel):
    html: str
    instruction: str
    email: str


@router.post("/refine-resume")
def refine_resume(data: RefineRequest, db: Session = Depends(get_db)):
    # 1️⃣ Deduct credits first (authoritative)
    credits_left = deduct_refine_credit(db, data.email)

    # 2️⃣ AI Prompt
    prompt = f"""
You are an expert resume editor.

RULES:
- You will receive an HTML resume.
- The user may have manually edited the HTML.
- DO NOT remove structure.
- DO NOT invent content.
- Only modify what the instruction explicitly asks.
- Preserve formatting, tags, and layout.
- Return FULL updated HTML only.

INSTRUCTION:
{data.instruction}

CURRENT RESUME HTML:
{data.html}
"""

    response = client.chat.completions.create(
        model="gpt-5.1",
        messages=[
            {"role": "system", "content": "You refine resumes without changing structure."},
            {"role": "user", "content": prompt}
        ],
        max_completion_tokens=5000,
    )
    updated_html = response.choices[0].message.content.strip()
    updated_html = updated_html.replace('```html', '').replace('```', '').strip()

    return {
        "updated_html": updated_html,
        "credits_left": credits_left
    }
