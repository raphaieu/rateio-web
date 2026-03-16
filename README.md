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
- **Onboarding V2**: A 3-step guided flow (Participants -> Items -> Review) for easy split creation.
- **Guest Identity Persistence**: Users can create and manage splits as guests with persistent local identity (no login required for core flow).
- **Mercado Pago Integration**: Real-time PIX payment for unlocking split results.
- **Public Receipts**: Shareable, read-only links for split verification.
- **Offline-First Drafts**: Drafts are kept in LocalStorage before being synced/finalized.
- **AI-Powered (Functional)**: Smart parsing of receipts (OCR), voice commands (Whisper) and dynamic costing based on usage.

## Deployment
Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_BASE_URL` in Vercel.
