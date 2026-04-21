# Anja Mila Ateliê

React + Vite + TypeScript app using Tailwind, Firebase, and Google Gemini.

## Setup
- Dev server runs via `npm run dev` on port 5000 (host 0.0.0.0, allowedHosts: true) for Replit proxy.
- Vite watch ignores `.local`, `.cache`, `.git`, `node_modules` to avoid reload loops.
- Removed GitHub-Pages-specific `base` path.

## Environment
- `GEMINI_API_KEY` — required for Gemini AI calls. Set in Secrets.

## Deployment
- Static deployment: `npm run build` -> `dist`.
