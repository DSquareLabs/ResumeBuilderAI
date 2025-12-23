# Resume Builder AI

A web-based AI-powered resume builder that generates ATS-optimized resumes
based on user input, job descriptions, and selected resume styles
(Harvard, Normal, Minimal, Custom).
<img width="1545" height="938" alt="image" src="https://github.com/user-attachments/assets/4148d8e6-385b-4195-a908-df6668c7cbff" />
<img width="1705" height="965" alt="image" src="https://github.com/user-attachments/assets/3a40a347-bb0f-4dc1-ac12-d5ce6d92fda7" />
<img width="1017" height="963" alt="image" src="https://github.com/user-attachments/assets/06bbc1fd-8c4c-48a0-9cd7-ad87fdba6f47" />

---

## 🚀 Tech Stack

### Frontend
- HTML
- CSS
- Vanilla JavaScript

### Backend
- Python
- FastAPI

### Database
- Supabase (PostgreSQL)

### Authentication
- Google Sign-In (Client-side)

### AI
- OpenAI API

---

## 🧠 Core Features

- Google Login
- User Profile Management
- AI Resume Generation (HTML + CSS)
- Multiple Resume Styles
- Inline Resume Editing
- Print / Save as PDF
- Credit-based usage (planned)

---
## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_supabase_postgres_url
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

▶️ Run Locally
1️⃣ Create virtual environment
```
python -m venv venv
```
2️⃣ Activate it
# Windows
```
venv\Scripts\activate
```
# macOS/Linux
```
source venv/bin/activate
```
3️⃣ Install dependencies
```
pip install -r requirements.txt
```
4️⃣ Run server
uvicorn app.main:app --reload


Open:

http://localhost:8000


