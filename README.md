# LearniO

Production-ready setup and deployment notes.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials (for NextAuth) and Gemini API key if AI features are enabled

## Environment Variables

Create env files from examples and fill values:

Client (`client/.env`):

- NEXT_PUBLIC_API_BASE_URL: Base URL of the server, e.g., https://api.example.com
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- NEXTAUTH_URL: Public URL of the Next.js app
- NEXTAUTH_SECRET: Random string

Server (`server/.env`):

- PORT: Server port (default 5000)
- CLIENT_URL: Public URL of the client, e.g., https://app.example.com
- DATABASE_URL: PostgreSQL connection string
- GEMINI_API_KEY: Google Generative AI key
- SMTP\_\*: SMTP settings for email reminders

## Install

In both folders:

- server/: npm install
- client/: npm install

## Build & Run

- Server: npm run start (use PM2 or systemd in production)
- Client: npm run build && npm run start

## Notes

- All client API calls use NEXT_PUBLIC_API_BASE_URL.
- Server CORS allows CLIENT_URL with credentials.
