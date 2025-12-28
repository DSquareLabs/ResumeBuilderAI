# generate_seo.py
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

# Your exact list from main.py
ALLOWED_ROLES = [
    "software-engineer", "frontend-developer", "backend-developer", "full-stack-developer",
    "data-scientist", "product-manager", "ui-ux-designer", "devops-engineer", "qa-engineer",
    "nurse", "registered-nurse", "medical-assistant", "dental-assistant", "pharmacist",
    "physical-therapist",
    "administrative-assistant", "customer-service-representative", "project-manager",
    "marketing-manager", "accountant", "sales-representative", "human-resources-manager",
    "business-analyst", "executive-assistant", "daily-equity",
    "teacher", "server", "bartender", "driver", "receptionist", "electrician",
    "graphic-designer", "writer"
]

descriptions = {}

print(f"Generating SEO descriptions for {len(ALLOWED_ROLES)} roles...")

for role in ALLOWED_ROLES:
    clean_role = role.replace("-", " ").title()
    print(f"Processing: {clean_role}...")
    
    prompt = f"""
    Write a specific, punchy, 2-sentence hook (max 40 words) for a landing page about a "{clean_role} Resume Builder".
    
    Explain why this specific job needs a tailored resume (e.g. mentions specific skills, certifications, or metrics).
    Do NOT use generic fluff like "Unlock your potential."
    
    Example for Nurse: "Hospital ATS systems scan for specific certifications like BLS and clinical rotations. Our builder ensures your nursing skills match the job description perfectly."
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini", # Cheap and fast
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    
    text = response.choices[0].message.content.replace('"', '').strip()
    descriptions[role] = text

# Save to file
with open("seo_descriptions.json", "w") as f:
    json.dump(descriptions, f, indent=2)

print("✅ Done! Saved to seo_descriptions.json")