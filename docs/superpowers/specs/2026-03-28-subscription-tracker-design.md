# Subscription Tracker — System Design

**Date:** 2026-03-28
**Status:** Approved
**Stack:** Next.js 15 App Router + TypeScript + Tailwind CSS + Prisma + PostgreSQL + NextAuth.js v5

---

## Overview

Personal subscription tracker web app สำหรับติดตาม subscription ทั้งหมด ดู spending summary รายเดือน/รายปี และรับ alert ก่อน billing date ออกแบบ mobile-first และรองรับการขยาย multi-user ในอนาคต

---

## Requirements

### Functional
- CRUD subscription (name, cost, currency, billing cycle, next billing date, category, payment method, logo URL, emoji, notes, status)
- Dashboard: monthly total, yearly total, active subscription count
- Alert strip: subscriptions ที่ครบภายใน 7 วัน (in-app only, highlighted)
- Upcoming list: subscriptions ทั้งหมดภายใน 30 วัน เรียงตาม nextBillingDate — รายการใน alert strip ปรากฏใน upcoming list ด้วย (ไม่แยก)
- Categories: Streaming, SaaS, Tools, Gaming, Cloud, Finance, Health, Other (system defaults) + custom per user
- Filter subscriptions by category
- Personal auth ตอนนี้ — ขยาย multi-user ได้ในอนาคต

### Non-Functional
- Mobile-first UI
- Deploy ได้ทั้ง Vercel (Neon PostgreSQL) และ VPS (Docker Compose)
- TypeScript strict mode

### Out of Scope (v1)
- Email / push notifications
- Multi-currency conversion
- Subscription history / analytics charts
- Import from bank statement
- Auto-advance nextBillingDate (user update เอง)
- File upload สำหรับ logo (user paste URL เอง)

---

## Architecture

```
subscription-management/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/                    # Protected routes
│   │   ├── dashboard/page.tsx
│   │   ├── subscriptions/
│   │   │   ├── page.tsx          # List + filter
│   │   │   ├── new/page.tsx      # Add form
│   │   │   └── [id]/page.tsx     # Edit/detail
│   │   └── settings/page.tsx
│   └── api/
│       └── auth/[...nextauth]/route.ts
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── subscription-card.tsx
│   ├── summary-cards.tsx
│   ├── alert-strip.tsx
│   ├── category-filter.tsx
│   └── bottom-nav.tsx
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   └── utils.ts                  # currency format, days-until calc, monthly cost calc
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # Default categories — ใช้ findFirst({ where: { slug, userId: null } })
│                                 # ก่อน create เสมอ (Prisma ไม่รองรับ null ใน compound unique where)
├── Dockerfile
└── docker-compose.yml
```

### Data Flow
- **Server Components** fetch data โดยตรงจาก Prisma — ไม่ผ่าน API, ไม่มี waterfall
- **Server Actions** สำหรับ create/update/delete — validate session ก่อน mutate ทุกครั้ง
- **Client Components** เฉพาะส่วนที่ต้องการ interactivity (form, filter tabs, bottom nav)

---

## Database Schema

```prisma
model User {
  id              String         @id @default(cuid())
  email           String         @unique
  name            String?
  password        String?        // hashed, nullable สำหรับ future OAuth
  defaultCurrency String         @default("THB")
  createdAt       DateTime       @default(now())
  subscriptions   Subscription[]
  categories      Category[]
}

model Subscription {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id])
  name            String
  description     String?
  cost            Decimal      @db.Decimal(10, 2)
  currency        String       @default("THB")
  billingCycle    BillingCycle
  nextBillingDate DateTime
  categoryId      String
  category        Category     @relation(fields: [categoryId], references: [id])
  paymentMethod   String?
  logoUrl         String?      // user paste URL — no upload endpoint
  logoEmoji       String?      // shown if logoUrl is empty or fails to load
  status          Status       @default(ACTIVE)
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model Category {
  id            String         @id @default(cuid())
  name          String
  slug          String
  color         String         // hex color for badge
  icon          String         // emoji
  userId        String?        // null = system default, value = user custom
  user          User?          @relation(fields: [userId], references: [id])
  subscriptions Subscription[]

  @@unique([slug, userId])     // prevent duplicate slug per user (null = system)
}

enum BillingCycle { MONTHLY YEARLY QUARTERLY }
enum Status       { ACTIVE PAUSED CANCELLED }
```

**Default categories (seeded):**
| Name | Slug | Color | Icon |
|---|---|---|---|
| Streaming | streaming | #E50914 | 🎬 |
| SaaS | saas | #0052CC | 💼 |
| Tools | tools | #00875A | 🔧 |
| Gaming | gaming | #5B21B6 | 🎮 |
| Cloud | cloud | #0EA5E9 | ☁️ |
| Finance | finance | #D97706 | 💰 |
| Health | health | #059669 | 🏥 |
| Other | other | #6B7280 | 📦 |

**Custom category defaults:** color `#6B7280`, icon `📦` (user สามารถเปลี่ยนได้)

---

## Business Logic

### Monthly Total Calculation
คำนวณเฉพาะ `status = ACTIVE`:
- `MONTHLY` → cost × 1
- `YEARLY` → cost ÷ 12
- `QUARTERLY` → cost ÷ 3

Yearly total = monthly total × 12

### Category Default
Form เพิ่ม subscription: pre-select category "Other" ถ้า user ไม่เลือก — `categoryId` ต้อง resolve เป็น id ของ "Other" system category ตอน submit

### nextBillingDate
User update เอง (manual) — ไม่มี auto-advance ใน v1

---

## Pages & UI

### Mobile Layout Pattern
```
┌─────────────────────┐
│  Header             │
├─────────────────────┤
│                     │
│   Page Content      │
│                     │
├─────────────────────┤
│ 🏠  📋  ⚙️          │  ← Bottom nav
└─────────────────────┘
```

### Dashboard (`/dashboard`)
- **Summary cards** (3 cards): Monthly total | Yearly total | Active count
- **Alert strip**: subscriptions ครบภายใน 7 วัน — แสดงชื่อ, วันที่ครบ, ยอด (highlight สีส้ม/แดง)
- **Upcoming list**: subscriptions ทั้งหมดภายใน 30 วัน เรียงตาม nextBillingDate — รวมรายการที่อยู่ใน alert strip ด้วย

### Subscriptions (`/subscriptions`)
- **Filter tabs**: All | per category (แสดงแค่ category ที่มี subscription)
- **Subscription card**: logo/emoji + name + cost (formatted) + next date + status badge
- **FAB** `+` เพื่อ add ใหม่

### Add/Edit Form (`/subscriptions/new`, `/subscriptions/[id]`)
Fields: name*, cost*, currency, billing cycle*, next billing date*, category (default: Other), payment method, logo URL, emoji, notes, status

### Settings (`/settings`)
- Default currency (เปลี่ยนได้, persist ใน `User.defaultCurrency`)
- Profile (name, email, change password)

---

## Auth

```ts
// lib/auth.ts — NextAuth.js v5 with JWT strategy (required for Credentials provider)
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Credentials({ ... })],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // required: Credentials provider ไม่รองรับ database sessions
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id   // attach id on first sign-in
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      return session
    }
  }
})
```

- Route protection via `middleware.ts` — guard ทุก route ใน `(app)` group
- ทุก Prisma query filter ด้วย `userId` จาก session เสมอ
- Future multi-user: เพิ่ม Google/GitHub provider ได้โดยไม่ต้อง refactor

---

## Deployment

### Vercel
```bash
DATABASE_URL="postgresql://..."   # Neon / Supabase
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-app.vercel.app"
```
- Auto-deploy จาก git push to `main`
- Vercel Postgres (Neon) free tier

### VPS (Docker Compose)
```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [db]
  db:
    image: postgres:16-alpine
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: subscriptions
      POSTGRES_PASSWORD: ${DB_PASSWORD}
volumes:
  postgres_data:
```
- Multi-stage Dockerfile (builder + runner)
- เปลี่ยนแค่ `DATABASE_URL` — codebase เหมือนกันทุกอย่าง

---

## Tech Stack Summary

| Layer | Tech |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js v5 (JWT strategy) |
| Date utils | date-fns |
| Deploy (Vercel) | Vercel + Neon |
| Deploy (VPS) | Docker + docker-compose |
