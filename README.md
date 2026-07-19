# SIGEM - Systeme de Gestion Miniere

SIGEM is a full-stack administrative prototype for managing mining enterprises, sites, permits, inspections, and ministry dashboard indicators.

## Apps

- `backend`: Express, TypeScript, Prisma, PostgreSQL, JWT auth
- `frontend`: Next.js App Router, TypeScript, Tailwind CSS, lucide-react

## Local Setup

1. Create PostgreSQL database `sigem`.
2. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

4. Run migrations and seed demo data:

```bash
cd backend
npm run migrate
npm run seed
```

5. Start both apps:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Backend runs on `http://localhost:4000`; frontend runs on `http://localhost:3000`.

Demo login:

- Email: `admin@sigem.cm`
- Password: `password123`

## Deployment Notes

Backend reads `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and `PORT`. Set `FRONTEND_URL` to the Vercel origin so CORS allows the deployed frontend.

Frontend reads `NEXT_PUBLIC_API_URL`, for example `https://your-railway-api.up.railway.app/api`.

Enterprise deletion is intentionally blocked by database relations when sites or permits exist. The UI confirmation explains this behavior.
