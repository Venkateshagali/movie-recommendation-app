# Movie Recommendation App

A full-stack movie recommendation application built as part of a Full Stack Developer Intern assignment.

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js with Fastify
- AI: OpenAI API
- Deployment: Vercel

## Features
- User can enter movie preferences
- AI generates 5 structured movie recommendations (title, year, genre, reason)
- Full-stack integration
- Deployed on cloud

## Live URLs
- Frontend: https://movie-recommendation-frontend-two.vercel.app
- Backend: https://movie-recommendation-backend-beryl.vercel.app

## Notes
- Environment variables are securely managed
- API keys are not included in the repository

## Local Setup

### 1) Backend
```bash
cd server
cp .env.example .env
# set OPENAI_API_KEY in .env
npm install
npm start
```

### 2) Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### 3) Vercel
- Backend project env var: `OPENAI_API_KEY`
- Frontend project env var: `VITE_API_BASE_URL=https://movie-recommendation-backend-beryl.vercel.app`
