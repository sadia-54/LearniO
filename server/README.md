## Server

Express + Prisma API for LearniO.

### Env setup

Copy `.env.example` to `.env` and set:

- PORT, CLIENT_URL
- DATABASE_URL
- GEMINI_API_KEY
- SMTP\_\* (optional)

### Run

- Development: npm run dev
- Production: npm run start

Health check: GET /health

# Backend Structure & Google OAuth

## Structure

- `index.js`: App entry, middleware, route imports
- `db.js`: Prisma client
- `passport.js`: Passport config (Google strategy)
- `controllers/`: Route logic (e.g., authController.js)
- `services/`: Business logic (e.g., userService.js)
- `routes/`: Express routers (e.g., authRoutes.js)

## Google OAuth Flow

1. User clicks Google login on frontend
2. Frontend hits `/api/auth/google` (redirects to Google)
3. Google redirects to `/api/auth/google/callback`
4. Backend verifies, upserts user with Prisma, issues JWT, sets HTTP-only cookie, redirects to `/home`
