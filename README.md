# Rateio Justo (Frontend)

Mobile-first bill splitting webapp.

## Stack
- Vue 3 + TypeScript + Vite
- TailwindCSS + shadcn-vue
- Clerk (Auth)
- Pinia (State)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment:
   Copy `.env.example` to `.env` and fill in Clerk key.
   ```bash
   cp .env.example .env
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

## Key Features
- **Offline Drafts**: Works without backend initially. Persists to LocalStorage.
- **Quick Add**: Create split -> auto-adds 2 participants.
- **Quick Item**: Fast item entry with currency formatting.

## Deployment
Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_BASE_URL` in Vercel.
