so n# CalmBot — Full Stack Mental Health Web App

## Quick Setup (Run these commands in order)

### 1. Backend (Python Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend will run at: http://localhost:5000

### 2. Frontend (React + Vite) — open a NEW terminal
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at: http://localhost:5173

### 3. Add your Groq API Key
Open `frontend/src/screens/Chat.jsx`
Find line: `const GROQ_KEY = 'PASTE_YOUR_GROQ_KEY_HERE'`
Replace with your actual key from console.groq.com

### 4. Open in browser
Go to: http://localhost:5173

---

## Features
- ✅ Real signup & login (SQLite database)
- ✅ Mood tracking with weekly charts
- ✅ AI-powered chat (Groq LLaMA 3.3)
- ✅ Progress page with insights & streaks
- ✅ Profile with photo upload
- ✅ Dark & Light mode
- ✅ Fully responsive (desktop + mobile)
- ✅ Crisis detection & resources
- ✅ Chat history saved per user

## Project Structure
```
calmbot-app/
├── backend/
│   ├── app.py              ← Flask entry point
│   ├── database.py         ← SQLite setup
│   ├── requirements.txt
│   └── routes/
│       ├── auth.py         ← login/signup
│       ├── user.py         ← profile/avatar
│       ├── mood.py         ← mood tracking
│       └── chat.py         ← chat history
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── context/AuthContext.jsx
    │   ├── components/Layout.jsx
    │   ├── screens/
    │   │   ├── Auth.jsx
    │   │   ├── Onboarding.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Chat.jsx
    │   │   ├── Progress.jsx
    │   │   ├── Profile.jsx
    │   │   └── Settings.jsx
    │   └── styles/
    └── package.json
```
# Mental-Health
