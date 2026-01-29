# ResumeMATCH

**Stop rewriting your resume for every job.** Paste a job description, get a tailored resume and cover letter in seconds.

🔗 **Live:** [myresumematch.com](https://myresumematch.com)

<img width="1545" height="938" alt="ResumeMATCH - Create tailored resumes" src="https://github.com/user-attachments/assets/4148d8e6-385b-4195-a908-df6668c7cbff" />
<img width="1705" height="965" alt="ResumeMATCH - Multiple styles" src="https://github.com/user-attachments/assets/3a40a347-bb0f-4dc1-ac12-d5ce6d92fda7" />
<img width="1017" height="963" alt="ResumeMATCH - Export to PDF" src="https://github.com/user-attachments/assets/06bbc1fd-8c4c-48a0-9cd7-ad87fdba6f47" />

---

## ✨ What makes it different?

- **Match to any job posting** – Paste a JD, get a resume that speaks to it
- **Cover letters included** – Write your narrative, we'll craft the letter
- **Multiple styles** – Harvard, Modern, Minimal, or create your own
- **Edit inline** – Tweak anything before you download
- **ATS-optimized** – Passes automated screening systems
- **Privacy-first** – Your resume stays on your device

---

## 🚀 Quick Start

1. Go to [myresumematch.com](https://myresumematch.com)
2. Sign in with Google
3. Paste a job description
4. Get your tailored resume + cover letter
5. Download as PDF

---

## 🛠 For Developers

### Tech Stack
- Frontend: HTML, CSS, Vanilla JS
- Backend: Python + FastAPI
- Database: Supabase (PostgreSQL)
- Auth: Google Sign-In

### Run locally

```bash
# Clone and setup
git clone https://github.com/yourusername/ResumeBuilderAI.git
cd ResumeBuilderAI

# Create .env file with:
# OPENAI_API_KEY=your_key
# DATABASE_URL=your_supabase_url
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_secret

# Install and run
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open: http://localhost:8000

---

## 📁 Project Structure

```
app/
├── main.py          # FastAPI routes
├── api/             # API endpoints
├── models/          # Database models
├── services/        # Business logic
└── static/          # Frontend files
```

---

