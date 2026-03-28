# Subscription Management — Project Instructions

## Project Overview

Personal subscription tracker — บันทึกและติดตาม subscription ทั้งหมด คำนวณค่าใช้จ่ายรายเดือน/รายปี

**Tech Stack:**
- Next.js 16.2.1 (App Router, Turbopack)
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui (Base UI)
- Prisma 7 + PostgreSQL
- NextAuth v5 beta (Credentials provider)
- React Hook Form + Zod
- Vitest (unit tests)

---

## Key Architecture Decisions

- **Server Components** — data fetching ทำใน Server Components โดยตรง ไม่มี API layer สำหรับ reads
- **Server Actions** — mutations ทุกอย่าง (create/update/delete) ผ่าน Server Actions เท่านั้น
- **Client Components** — ใช้เฉพาะส่วนที่ interactive จริงๆ: forms, filters, bottom nav
- **JWT strategy** — required เมื่อใช้ Credentials provider กับ NextAuth v5
- **Route Groups:**
  - `(app)` — authenticated routes
  - `(auth)` — public routes (login, register)

---

## File Structure

```
app/
  (app)/          — authenticated pages
  (auth)/         — public pages (login/register)
auth.config.ts    — Edge-compatible auth config (ใช้ใน proxy.ts)
proxy.ts          — Route protection (Next.js 16 renamed from middleware.ts)
prisma.config.ts  — Prisma 7 datasource + seed config
lib/
  auth.ts         — Full auth config (Credentials + bcrypt, Node.js only)
  db.ts           — Prisma singleton ใช้ PrismaPg driver adapter
  utils.ts        — Pure utility functions (calculateMonthlyCost, daysUntil, etc.)
  actions/
    subscription.actions.ts  — Server Actions CRUD สำหรับ subscription
    settings.actions.ts      — Server Actions สำหรับ profile/password
prisma/
  schema.prisma
  seed.ts
  create-test-user.ts
```

---

## Critical: Prisma 7 Pattern

Prisma 7 **ต้องใช้ driver adapter** เสมอ — ห้ามสร้าง PrismaClient โดยไม่มี adapter:

```ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
```

datasource config อยู่ใน `prisma.config.ts` ไม่ใช่ใน `schema.prisma`

---

## Critical: shadcn/ui Select (Base UI)

`onValueChange` คืนค่า `string | null` — ต้องมี null guard เสมอ:

```ts
onValueChange={(v) => {
  if (v) setValue('field', v)
}}
```

---

## Critical: NextAuth v5 Split Config

NextAuth v5 แยก config เป็น 2 ไฟล์เพื่อรองรับ Edge runtime:

| ไฟล์ | ใช้สำหรับ | ข้อจำกัด |
|------|-----------|----------|
| `auth.config.ts` | Edge-safe config | ห้าม import bcrypt หรือ Prisma |
| `lib/auth.ts` | Full Node.js config | import จาก `auth.config.ts` แล้วเพิ่ม providers |
| `proxy.ts` | Route protection | import จาก `auth.config.ts` เท่านั้น |

---

## Critical: Next.js 16 Breaking Changes

- **`middleware.ts` → `proxy.ts`** — Next.js 16 เปลี่ยนชื่อ middleware file
- **Route params เป็น Promise** — ต้อง `await params` ก่อนใช้:
  ```ts
  // Next.js 16
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  }
  ```
- **Tailwind v4** — ไม่ต้องมี `tailwind.config.ts`

---

## Development Setup

```bash
# 1. Start PostgreSQL (Docker)
docker run -d --name pg-sub \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=subscriptions \
  -p 5432:5432 postgres:16-alpine

# 2. Create .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/subscriptions"
AUTH_SECRET="your-secret-here"   # ไม่ใช่ NEXTAUTH_SECRET
AUTH_URL="http://localhost:3000"

# 3. Sync schema
npx prisma db push

# 4. Seed default categories
npx prisma db seed

# 5. Create test user (test@example.com / password123)
npx tsx prisma/create-test-user.ts

# 6. Start dev server
npm run dev
```

---

## Commands

| Command | ทำอะไร |
|---------|--------|
| `npm run dev` | Dev server (Turbopack) |
| `npm test` | Vitest unit tests |
| `npx tsc --noEmit` | TypeScript type check |
| `npx prisma db push` | Sync schema ไปยัง DB |
| `npx prisma db seed` | Seed default categories |
| `npx tsx prisma/create-test-user.ts` | สร้าง test user |
| `npx prisma studio` | GUI สำหรับ browse data |

---

## Environment Variables

```bash
DATABASE_URL=       # PostgreSQL connection string
AUTH_SECRET=        # NextAuth v5 secret (ไม่ใช่ NEXTAUTH_SECRET)
AUTH_URL=           # Base URL ของ app (http://localhost:3000 สำหรับ dev)
```

---

## Known Version Constraints

- **Next.js 16:** `proxy.ts` แทน `middleware.ts`, route params เป็น `Promise<Params>`
- **Prisma 7:** ต้องมี driver adapter, datasource อยู่ใน `prisma.config.ts`
- **NextAuth v5 beta:** ใช้ `AUTH_SECRET` ไม่ใช่ `NEXTAUTH_SECRET`
- **Tailwind v4:** ไม่ต้องมี `tailwind.config.ts`
- **shadcn/ui Base UI:** `Select.onValueChange` คืน `string | null`
