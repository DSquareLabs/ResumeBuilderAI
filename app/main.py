from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.profile import router as profile_router

from app.database import engine, Base
from app.models.profile import Profile

Base.metadata.create_all(bind=engine)


load_dotenv()
client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



class ResumeInput(BaseModel):
    resume_text: str
    job_description: str
    
@app.post("/api/generate")
def generate_resume(data: ResumeInput):
    prompt = f"""
You are a professional resume editor.

Rules:
- Do NOT invent experience
- Do NOT add skills not present
- Optimize for ATS
- Keep it concise

Resume:
{data.resume_text}

Job Description:
{data.job_description}

Return valid HTML only.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert resume editor."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=800
    )

    return {
        "html": response.choices[0].message.content
    } 
    
@app.get("/dx")
def home():
    return {"message": "Hello Resume AI"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Page Routes

@app.get("/")
def login_page():
    return FileResponse("app/static/pages/login.html")

@app.get("/profile")
def profile_page():
    return FileResponse("app/static/pages/profile.html")

@app.get("/builder")
def builder_page():
    return FileResponse("app/static/pages/builder.html")

@app.get("/result/{resume_id}")
def result_page(resume_id: int):
    return FileResponse("app/static/pages/result.html")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(profile_router, prefix="/api")