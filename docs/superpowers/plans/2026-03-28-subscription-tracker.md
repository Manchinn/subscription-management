# Subscription Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first personal subscription tracker with dashboard, CRUD, category filtering, and billing alerts.

**Architecture:** Next.js 15 App Router with Server Components fetching directly from Prisma (no API layer for reads), Server Actions for mutations, Client Components only for interactive UI. NextAuth.js v5 with JWT strategy guards the `(app)` route group.

**Tech Stack:** Next.js 15, TypeScript strict, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, NextAuth.js v5, React Hook Form + Zod, date-fns, bcryptjs

---

## File Map

```
subscription-management/
├── app/
│   ├── layout.tsx                        # Root layout (html/body)
│   ├── page.tsx                          # / → redirect to /dashboard
│   ├── (auth)/
│   │   ├── layout.tsx                    # Auth layout (no nav)
│   │   └── login/page.tsx                # Login form
│   ├── (app)/
│   │   ├── layout.tsx                    # App layout: Header + BottomNav
│   │   ├── dashboard/page.tsx            # Server Component: dashboard
│   │   ├── subscriptions/
│   │   │   ├── page.tsx                  # Server Component: list + filter
│   │   │   ├── new/page.tsx              # Add form page
│   │   │   └── [id]/page.tsx             # Edit form page
│   │   └── settings/page.tsx             # Settings form page
│   └── api/auth/[...nextauth]/route.ts   # NextAuth handlers
├── components/
│   ├── ui/                               # shadcn/ui (auto-generated)
│   ├── bottom-nav.tsx                    # Client: bottom nav bar
│   ├── subscription-card.tsx             # Subscription list item card
│   ├── subscription-logo.tsx             # Logo URL or emoji fallback
│   ├── subscription-form.tsx             # Client: add/edit form
│   ├── summary-cards.tsx                 # Monthly/Yearly/Count cards
│   ├── alert-strip.tsx                   # 7-day billing alert banner
│   └── category-filter.tsx              # Client: category filter tabs
├── lib/
│   ├── db.ts                             # Prisma singleton
│   ├── auth.ts                           # NextAuth config
│   ├── utils.ts                          # Pure utility functions
│   └── actions/
│       ├── subscription.actions.ts       # Server Actions: CRUD
│       └── settings.actions.ts          # Server Actions: settings update
├── types/index.ts                        # Shared TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── __tests__/lib/utils.test.ts           # Unit tests for pure functions
├── middleware.ts                         # Route protection
├── .env.example
├── Dockerfile
└── docker-compose.yml
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.example`, `.env.local`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd "C:/Users/chinn/subscription-management"
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter \
  bcryptjs react-hook-form @hookform/resolvers zod date-fns

npm install -D @types/bcryptjs @types/node vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
# ตอบ: Default → Yes → slate → yes
```

Add base components:
```bash
npx shadcn@latest add button card input label select textarea badge tabs dialog
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create .env.example**

```bash
# .env.example
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/subscriptions"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 6: Create .env.local (local dev)**

```bash
# .env.local (git-ignored)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/subscriptions"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with dependencies"
```

---

## Task 2: Prisma Schema + Database + Seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema.prisma**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String         @id @default(cuid())
  email           String         @unique
  name            String?
  password        String?
  defaultCurrency String         @default("THB")
  createdAt       DateTime       @default(now())
  subscriptions   Subscription[]
  categories      Category[]
  // NextAuth required fields
  accounts        Account[]
  sessions        Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Subscription {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  description     String?
  cost            Decimal      @db.Decimal(10, 2)
  currency        String       @default("THB")
  billingCycle    BillingCycle
  nextBillingDate DateTime
  categoryId      String
  category        Category     @relation(fields: [categoryId], references: [id])
  paymentMethod   String?
  logoUrl         String?
  logoEmoji       String?
  status          Status       @default(ACTIVE)
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model Category {
  id            String         @id @default(cuid())
  name          String
  slug          String
  color         String
  icon          String
  userId        String?
  user          User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptions Subscription[]

  @@unique([slug, userId])
}

enum BillingCycle {
  MONTHLY
  YEARLY
  QUARTERLY
}

enum Status {
  ACTIVE
  PAUSED
  CANCELLED
}
```

- [ ] **Step 3: Write seed.ts**

```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  { name: 'Streaming', slug: 'streaming', color: '#E50914', icon: '🎬' },
  { name: 'SaaS',      slug: 'saas',      color: '#0052CC', icon: '💼' },
  { name: 'Tools',     slug: 'tools',     color: '#00875A', icon: '🔧' },
  { name: 'Gaming',    slug: 'gaming',    color: '#5B21B6', icon: '🎮' },
  { name: 'Cloud',     slug: 'cloud',     color: '#0EA5E9', icon: '☁️' },
  { name: 'Finance',   slug: 'finance',   color: '#D97706', icon: '💰' },
  { name: 'Health',    slug: 'health',    color: '#059669', icon: '🏥' },
  { name: 'Other',     slug: 'other',     color: '#6B7280', icon: '📦' },
]

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    // Prisma ไม่รองรับ null ใน compound unique where — ใช้ findFirst + create
    const existing = await prisma.category.findFirst({
      where: { slug: cat.slug, userId: null },
    })
    if (!existing) {
      await prisma.category.create({ data: { ...cat, userId: null } })
    }
  }
  console.log('Seeded default categories')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Install ts-node:
```bash
npm install -D ts-node
```

- [ ] **Step 4: Run migration and seed**

```bash
npx prisma db push
npx prisma db seed
```

Expected: "Seeded default categories"

- [ ] **Step 5: Commit**

```bash
git add prisma/ package.json
git commit -m "feat: add Prisma schema and seed default categories"
```

---

## Task 3: Utility Functions (TDD)

**Files:**
- Create: `lib/utils.ts`, `__tests__/lib/utils.test.ts`
- Create: `types/index.ts`

- [ ] **Step 1: Create shared types**

```ts
// types/index.ts
import type { Subscription, Category, BillingCycle, Status } from '@prisma/client'

export type SubscriptionWithCategory = Subscription & {
  category: Category
}

export type { BillingCycle, Status }
```

- [ ] **Step 2: Write failing tests first**

```ts
// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import {
  calculateMonthlyCost,
  calculateYearlyCost,
  formatCurrency,
  daysUntil,
  isAlertingSoon,
  isUpcoming,
} from '@/lib/utils'
import { BillingCycle } from '@prisma/client'
import type { Decimal } from '@prisma/client/runtime/library'

const dec = (v: number) => v as unknown as Decimal

describe('calculateMonthlyCost', () => {
  it('returns cost as-is for MONTHLY', () => {
    expect(calculateMonthlyCost(dec(100), BillingCycle.MONTHLY)).toBeCloseTo(100)
  })
  it('divides by 12 for YEARLY', () => {
    expect(calculateMonthlyCost(dec(1200), BillingCycle.YEARLY)).toBeCloseTo(100)
  })
  it('divides by 3 for QUARTERLY', () => {
    expect(calculateMonthlyCost(dec(300), BillingCycle.QUARTERLY)).toBeCloseTo(100)
  })
})

describe('calculateYearlyCost', () => {
  it('multiplies monthly cost by 12', () => {
    expect(calculateYearlyCost(dec(100), BillingCycle.MONTHLY)).toBeCloseTo(1200)
  })
})

describe('formatCurrency', () => {
  it('formats THB correctly', () => {
    const result = formatCurrency(100, 'THB')
    expect(result).toContain('100')
    expect(result).toContain('฿')
  })
  it('formats USD correctly', () => {
    const result = formatCurrency(9.99, 'USD')
    expect(result).toContain('9.99')
  })
})

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    const today = new Date()
    expect(daysUntil(today)).toBe(0)
  })
  it('returns 7 for 7 days from now', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    expect(daysUntil(future)).toBe(7)
  })
  it('returns negative for past dates', () => {
    const past = new Date()
    past.setDate(past.getDate() - 3)
    expect(daysUntil(past)).toBe(-3)
  })
})

describe('isAlertingSoon', () => {
  it('returns true if within 7 days', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 5)
    expect(isAlertingSoon(soon)).toBe(true)
  })
  it('returns false if more than 7 days away', () => {
    const far = new Date()
    far.setDate(far.getDate() + 10)
    expect(isAlertingSoon(far)).toBe(false)
  })
})

describe('isUpcoming', () => {
  it('returns true if within 30 days', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 20)
    expect(isUpcoming(soon)).toBe(true)
  })
  it('returns false if more than 30 days away', () => {
    const far = new Date()
    far.setDate(far.getDate() + 35)
    expect(isUpcoming(far)).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — "cannot find module '@/lib/utils'"

- [ ] **Step 4: Implement lib/utils.ts**

```ts
// lib/utils.ts
import { differenceInCalendarDays } from 'date-fns'
import { BillingCycle } from '@prisma/client'
import type { Decimal } from '@prisma/client/runtime/library'

export function calculateMonthlyCost(cost: Decimal, cycle: BillingCycle): number {
  const n = Number(cost)
  switch (cycle) {
    case BillingCycle.MONTHLY:   return n
    case BillingCycle.YEARLY:    return n / 12
    case BillingCycle.QUARTERLY: return n / 3
  }
}

export function calculateYearlyCost(cost: Decimal, cycle: BillingCycle): number {
  return calculateMonthlyCost(cost, cycle) * 12
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function daysUntil(date: Date): number {
  return differenceInCalendarDays(date, new Date())
}

export function isAlertingSoon(date: Date, thresholdDays = 7): boolean {
  const d = daysUntil(date)
  return d >= 0 && d <= thresholdDays
}

export function isUpcoming(date: Date, thresholdDays = 30): boolean {
  const d = daysUntil(date)
  return d >= 0 && d <= thresholdDays
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/utils.ts types/index.ts __tests__/
git commit -m "feat: add utility functions with tests (calculateMonthlyCost, daysUntil, etc.)"
```

---

## Task 4: Auth Setup

**Files:**
- Create: `lib/db.ts`, `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`

- [ ] **Step 1: Create Prisma singleton**

```ts
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Create NextAuth config**

```ts
// lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' }, // required: Credentials provider ไม่รองรับ database sessions
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user?.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
```

- [ ] **Step 3: Create NextAuth route handler**

```ts
// app/api/auth/[...nextauth]/route.ts
export { handlers as GET, handlers as POST } from '@/lib/auth'
```

- [ ] **Step 4: Extend NextAuth types**

Create `types/next-auth.d.ts`:
```ts
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}
```

- [ ] **Step 5: Create middleware**

```ts
// middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/subscriptions/:path*', '/settings/:path*'],
}
```

- [ ] **Step 6: Create a test user (dev only)**

```ts
// prisma/create-test-user.ts  (run once manually, not in seed)
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
async function main() {
  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: { email: 'test@example.com', name: 'Test User', password: hash },
  })
  console.log('Created test user: test@example.com / password123')
}
main().finally(() => prisma.$disconnect())
```

Run:
```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/create-test-user.ts
```

- [ ] **Step 7: Verify auth works**

```bash
npm run dev
```

Open `http://localhost:3000` — should redirect to `/login`
Login with `test@example.com` / `password123` — should succeed

- [ ] **Step 8: Commit**

```bash
git add lib/db.ts lib/auth.ts app/api/ middleware.ts types/next-auth.d.ts prisma/create-test-user.ts
git commit -m "feat: setup NextAuth.js v5 with Credentials provider and JWT strategy"
```

---

## Task 5: App Layout + Login Page

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`
- Create: `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`
- Create: `app/(app)/layout.tsx`, `components/bottom-nav.tsx`

- [ ] **Step 1: Root layout**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Subscription Tracker',
  description: 'Track your subscriptions',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Root page redirect**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/dashboard')
}
```

- [ ] **Step 3: Auth layout**

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      {children}
    </main>
  )
}
```

- [ ] **Step 4: Login page**

```tsx
// app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const data = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      email: data.get('email'),
      password: data.get('password'),
      redirect: false,
    })

    setLoading(false)
    if (res?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Subscription Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoFocus />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Bottom nav component**

```tsx
// components/bottom-nav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',      label: 'Home',          icon: Home },
  { href: '/subscriptions',  label: 'Subscriptions', icon: List },
  { href: '/settings',       label: 'Settings',      icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
      <div className="flex h-16 items-center justify-around max-w-md mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 text-xs',
                active ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

Note: `cn` utility from shadcn — add to `lib/utils.ts` if not already there:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install if needed:
```bash
npm install clsx tailwind-merge lucide-react
```

- [ ] **Step 6: App layout**

```tsx
// app/(app)/layout.tsx
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">Subscription Tracker</h1>
      </header>
      <main className="mx-auto max-w-md px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 7: Verify layout**

```bash
npm run dev
```

Navigate: login → `/dashboard` (placeholder) → bottom nav works

- [ ] **Step 8: Commit**

```bash
git add app/ components/bottom-nav.tsx
git commit -m "feat: add app layout, auth layout, login page, bottom nav"
```

---

## Task 6: Server Actions — Subscription CRUD

**Files:**
- Create: `lib/actions/subscription.actions.ts`

- [ ] **Step 1: Write Zod schema + Server Actions**

```ts
// lib/actions/subscription.actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BillingCycle, Status } from '@prisma/client'

export const subscriptionSchema = z.object({
  name:            z.string().min(1, 'Name is required'),
  description:     z.string().optional(),
  cost:            z.coerce.number().positive('Cost must be positive'),
  currency:        z.string().default('THB'),
  billingCycle:    z.nativeEnum(BillingCycle),
  nextBillingDate: z.coerce.date(),
  categoryId:      z.string().min(1),
  paymentMethod:   z.string().optional(),
  logoUrl:         z.string().url().optional().or(z.literal('')),
  logoEmoji:       z.string().optional(),
  status:          z.nativeEnum(Status).default('ACTIVE'),
  notes:           z.string().optional(),
})

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}

export async function createSubscription(data: z.infer<typeof subscriptionSchema>) {
  const userId = await requireUserId()
  const parsed = subscriptionSchema.parse(data)

  await prisma.subscription.create({
    data: { ...parsed, userId, cost: parsed.cost },
  })

  revalidatePath('/dashboard')
  revalidatePath('/subscriptions')
  redirect('/subscriptions')
}

export async function updateSubscription(
  id: string,
  data: z.infer<typeof subscriptionSchema>
) {
  const userId = await requireUserId()
  const parsed = subscriptionSchema.parse(data)

  await prisma.subscription.update({
    where: { id, userId }, // userId guard prevents editing others' data
    data: { ...parsed, cost: parsed.cost },
  })

  revalidatePath('/dashboard')
  revalidatePath('/subscriptions')
  redirect('/subscriptions')
}

export async function deleteSubscription(id: string) {
  const userId = await requireUserId()

  await prisma.subscription.delete({ where: { id, userId } })

  revalidatePath('/dashboard')
  revalidatePath('/subscriptions')
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/subscription.actions.ts
git commit -m "feat: add subscription Server Actions (create, update, delete)"
```

---

## Task 7: Dashboard Page

**Files:**
- Create: `app/(app)/dashboard/page.tsx`, `components/summary-cards.tsx`, `components/alert-strip.tsx`

- [ ] **Step 1: Summary cards component**

```tsx
// components/summary-cards.tsx
import { formatCurrency } from '@/lib/utils'

interface SummaryCardsProps {
  monthlyTotal: number
  yearlyTotal: number
  activeCount: number
  currency: string
}

export function SummaryCards({ monthlyTotal, yearlyTotal, activeCount, currency }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <p className="text-xs text-gray-500">Monthly</p>
        <p className="mt-1 text-sm font-semibold">{formatCurrency(monthlyTotal, currency)}</p>
      </div>
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <p className="text-xs text-gray-500">Yearly</p>
        <p className="mt-1 text-sm font-semibold">{formatCurrency(yearlyTotal, currency)}</p>
      </div>
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <p className="text-xs text-gray-500">Active</p>
        <p className="mt-1 text-sm font-semibold">{activeCount}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Alert strip component**

```tsx
// components/alert-strip.tsx
import { daysUntil, formatCurrency } from '@/lib/utils'
import type { SubscriptionWithCategory } from '@/types'

interface AlertStripProps {
  subscriptions: SubscriptionWithCategory[]
}

export function AlertStrip({ subscriptions }: AlertStripProps) {
  if (subscriptions.length === 0) return null

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
      <p className="mb-2 text-xs font-semibold text-orange-700 uppercase tracking-wide">
        Due within 7 days
      </p>
      <ul className="space-y-1.5">
        {subscriptions.map((sub) => {
          const days = daysUntil(new Date(sub.nextBillingDate))
          return (
            <li key={sub.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-orange-900">
                {sub.logoEmoji && <span className="mr-1">{sub.logoEmoji}</span>}
                {sub.name}
              </span>
              <span className="text-orange-700">
                {days === 0 ? 'Today' : `${days}d`} · {formatCurrency(Number(sub.cost), sub.currency)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Dashboard page (Server Component)**

```tsx
// app/(app)/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Status } from '@prisma/client'
import {
  calculateMonthlyCost,
  calculateYearlyCost,
  isAlertingSoon,
  isUpcoming,
  formatCurrency,
  daysUntil,
} from '@/lib/utils'
import { SummaryCards } from '@/components/summary-cards'
import { AlertStrip } from '@/components/alert-strip'
import type { SubscriptionWithCategory } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: { status: Status.ACTIVE },
        include: { category: true },
        orderBy: { nextBillingDate: 'asc' },
      },
    },
  })

  if (!user) redirect('/login')

  const subs = user.subscriptions as SubscriptionWithCategory[]

  // Totals (active only)
  const monthlyTotal = subs.reduce(
    (sum, s) => sum + calculateMonthlyCost(s.cost, s.billingCycle),
    0
  )
  const yearlyTotal = monthlyTotal * 12

  const alertSubs = subs.filter((s) => isAlertingSoon(new Date(s.nextBillingDate)))
  const upcomingSubs = subs.filter((s) => isUpcoming(new Date(s.nextBillingDate)))

  return (
    <div className="space-y-4">
      <SummaryCards
        monthlyTotal={monthlyTotal}
        yearlyTotal={yearlyTotal}
        activeCount={subs.length}
        currency={user.defaultCurrency}
      />

      <AlertStrip subscriptions={alertSubs} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Upcoming (30 days)
        </h2>
        {upcomingSubs.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming bills</p>
        ) : (
          <ul className="space-y-2">
            {upcomingSubs.map((sub) => {
              const days = daysUntil(new Date(sub.nextBillingDate))
              const isAlert = isAlertingSoon(new Date(sub.nextBillingDate))
              return (
                <li key={sub.id}>
                  <Link
                    href={`/subscriptions/${sub.id}`}
                    className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm active:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{sub.logoEmoji ?? sub.category.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{sub.name}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(sub.nextBillingDate), 'MMM d')} ·{' '}
                          {days === 0 ? 'today' : `${days} days`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${isAlert ? 'text-orange-600' : ''}`}>
                      {formatCurrency(Number(sub.cost), sub.currency)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Verify dashboard**

```bash
npm run dev
```

Login → `/dashboard` — summary cards, alert strip (if any), upcoming list visible

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/dashboard/ components/summary-cards.tsx components/alert-strip.tsx
git commit -m "feat: add dashboard with summary cards, alert strip, upcoming list"
```

---

## Task 8: Subscription List Page

**Files:**
- Create: `app/(app)/subscriptions/page.tsx`, `components/subscription-card.tsx`, `components/subscription-logo.tsx`, `components/category-filter.tsx`

- [ ] **Step 1: Subscription logo component**

```tsx
// components/subscription-logo.tsx
'use client'
import { useState } from 'react'

interface SubscriptionLogoProps {
  logoUrl?: string | null
  logoEmoji?: string | null
  categoryIcon: string
  name: string
  size?: 'sm' | 'md'
}

export function SubscriptionLogo({ logoUrl, logoEmoji, categoryIcon, name, size = 'md' }: SubscriptionLogoProps) {
  const [imgError, setImgError] = useState(false)
  const dim = size === 'sm' ? 32 : 40
  const emoji = logoEmoji ?? categoryIcon

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={dim}
        height={dim}
        onError={() => setImgError(true)}
        className="rounded-lg object-contain"
        style={{ width: dim, height: dim }}
      />
    )
  }
  return (
    <span
      className="flex items-center justify-center rounded-lg bg-gray-100"
      style={{ width: dim, height: dim, fontSize: size === 'sm' ? 16 : 20 }}
    >
      {emoji}
    </span>
  )
}
```

- [ ] **Step 2: Subscription card component**

```tsx
// components/subscription-card.tsx
import Link from 'next/link'
import { format } from 'date-fns'
import { formatCurrency, daysUntil, isAlertingSoon } from '@/lib/utils'
import { SubscriptionLogo } from '@/components/subscription-logo'
import { Badge } from '@/components/ui/badge'
import type { SubscriptionWithCategory } from '@/types'
import { Status } from '@prisma/client'

interface SubscriptionCardProps {
  subscription: SubscriptionWithCategory
}

const STATUS_COLORS: Record<Status, string> = {
  ACTIVE:    'bg-green-100 text-green-700',
  PAUSED:    'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export function SubscriptionCard({ subscription: sub }: SubscriptionCardProps) {
  const days = daysUntil(new Date(sub.nextBillingDate))
  const alert = isAlertingSoon(new Date(sub.nextBillingDate))

  return (
    <Link
      href={`/subscriptions/${sub.id}`}
      className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm active:bg-gray-50"
    >
      <SubscriptionLogo
        logoUrl={sub.logoUrl}
        logoEmoji={sub.logoEmoji}
        categoryIcon={sub.category.icon}
        name={sub.name}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{sub.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[sub.status]}`}>
            {sub.status.toLowerCase()}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          <span
            className="inline-block rounded px-1"
            style={{ background: sub.category.color + '22', color: sub.category.color }}
          >
            {sub.category.icon} {sub.category.name}
          </span>
          {' · '}
          {format(new Date(sub.nextBillingDate), 'MMM d')}
          {alert && <span className="ml-1 text-orange-500">({days === 0 ? 'today' : `${days}d`})</span>}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-semibold ${alert ? 'text-orange-600' : ''}`}>
        {formatCurrency(Number(sub.cost), sub.currency)}
      </p>
    </Link>
  )
}
```

- [ ] **Step 3: Category filter (Client Component)**

```tsx
// components/category-filter.tsx
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: { id: string; slug: string; name: string; icon: string }[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? 'all'

  function select(slug: string) {
    const params = new URLSearchParams(searchParams)
    if (slug === 'all') params.delete('category')
    else params.set('category', slug)
    router.push(`${pathname}?${params.toString()}`)
  }

  const tabs = [{ id: 'system-all', slug: 'all', name: 'All', icon: '🔍' }, ...categories]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {tabs.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => select(cat.slug)}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            current === cat.slug
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-gray-200 bg-white text-gray-600'
          )}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Subscriptions list page**

```tsx
// app/(app)/subscriptions/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SubscriptionCard } from '@/components/subscription-card'
import { CategoryFilter } from '@/components/category-filter'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { SubscriptionWithCategory } from '@/types'

interface Props {
  searchParams: Promise<{ category?: string }>
}

export default async function SubscriptionsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const { category } = await searchParams

  // Get all categories that have at least one subscription
  const usedCategories = await prisma.category.findMany({
    where: {
      subscriptions: { some: { userId: session.user.id } },
    },
    orderBy: { name: 'asc' },
  })

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
      ...(category ? { category: { slug: category } } : {}),
    },
    include: { category: true },
    orderBy: { nextBillingDate: 'asc' },
  }) as SubscriptionWithCategory[]

  return (
    <div className="space-y-3">
      <Suspense>
        <CategoryFilter categories={usedCategories} />
      </Suspense>

      {subscriptions.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No subscriptions yet</p>
      ) : (
        <ul className="space-y-2">
          {subscriptions.map((sub) => (
            <li key={sub.id}>
              <SubscriptionCard subscription={sub} />
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      <Link
        href="/subscriptions/new"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg active:bg-blue-700"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
```

- [ ] **Step 5: Verify list page**

```bash
npm run dev
```

Navigate to `/subscriptions` — filter tabs visible, FAB works

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/subscriptions/page.tsx components/subscription-card.tsx components/subscription-logo.tsx components/category-filter.tsx
git commit -m "feat: add subscription list page with category filter and cards"
```

---

## Task 9: Add/Edit Subscription Form

**Files:**
- Create: `components/subscription-form.tsx`, `app/(app)/subscriptions/new/page.tsx`, `app/(app)/subscriptions/[id]/page.tsx`

- [ ] **Step 1: Subscription form component**

```tsx
// components/subscription-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { subscriptionSchema, createSubscription, updateSubscription, deleteSubscription } from '@/lib/actions/subscription.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { BillingCycle, Status } from '@prisma/client'
import type { Category } from '@prisma/client'
import { format } from 'date-fns'
import { useTransition } from 'react'

type FormData = z.infer<typeof subscriptionSchema>

interface SubscriptionFormProps {
  categories: Category[]
  defaultCategoryId: string
  defaultCurrency: string
  initialData?: Partial<FormData> & { id?: string }
}

export function SubscriptionForm({
  categories,
  defaultCategoryId,
  defaultCurrency,
  initialData,
}: SubscriptionFormProps) {
  const isEdit = !!initialData?.id
  const [pending, startTransition] = useTransition()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      currency: defaultCurrency,
      billingCycle: BillingCycle.MONTHLY,
      status: Status.ACTIVE,
      categoryId: defaultCategoryId,
      ...initialData,
      nextBillingDate: initialData?.nextBillingDate
        ? new Date(initialData.nextBillingDate)
        : new Date(),
    },
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      if (isEdit && initialData?.id) {
        await updateSubscription(initialData.id, data)
      } else {
        await createSubscription(data)
      }
    })
  }

  function handleDelete() {
    if (!initialData?.id || !confirm('Delete this subscription?')) return
    startTransition(async () => {
      await deleteSubscription(initialData.id!)
    })
  }

  const nextBillingDate = watch('nextBillingDate')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} placeholder="Netflix" />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cost">Cost *</Label>
          <Input id="cost" type="number" step="0.01" {...register('cost')} placeholder="0.00" />
          {errors.cost && <p className="text-xs text-red-500">{errors.cost.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Input {...register('currency')} placeholder="THB" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Billing Cycle *</Label>
        <Select
          defaultValue={watch('billingCycle')}
          onValueChange={(v) => setValue('billingCycle', v as BillingCycle)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="YEARLY">Yearly</SelectItem>
            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="nextBillingDate">Next Billing Date *</Label>
        <Input
          id="nextBillingDate"
          type="date"
          value={nextBillingDate ? format(new Date(nextBillingDate), 'yyyy-MM-dd') : ''}
          onChange={(e) => setValue('nextBillingDate', new Date(e.target.value))}
        />
      </div>

      <div className="space-y-1">
        <Label>Category</Label>
        <Select
          defaultValue={watch('categoryId')}
          onValueChange={(v) => setValue('categoryId', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Input id="paymentMethod" {...register('paymentMethod')} placeholder="Credit Card" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" {...register('logoUrl')} placeholder="https://..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="logoEmoji">Emoji</Label>
          <Input id="logoEmoji" {...register('logoEmoji')} placeholder="🎬" />
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1">
          <Label>Status</Label>
          <Select
            defaultValue={watch('status')}
            onValueChange={(v) => setValue('status', v as Status)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={2} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Subscription'}
        </Button>
        {isEdit && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}
```

- [ ] **Step 2: New subscription page**

```tsx
// app/(app)/subscriptions/new/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SubscriptionForm } from '@/components/subscription-form'

export default async function NewSubscriptionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [categories, user] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId: session.user.id }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])

  const otherCategory = categories.find((c) => c.slug === 'other' && c.userId === null)

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Add Subscription</h2>
      <SubscriptionForm
        categories={categories}
        defaultCategoryId={otherCategory?.id ?? categories[0].id}
        defaultCurrency={user?.defaultCurrency ?? 'THB'}
      />
    </div>
  )
}
```

- [ ] **Step 3: Edit subscription page**

```tsx
// app/(app)/subscriptions/[id]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { SubscriptionForm } from '@/components/subscription-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSubscriptionPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const { id } = await params

  const [subscription, categories, user] = await Promise.all([
    prisma.subscription.findUnique({
      where: { id, userId: session.user.id },
    }),
    prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId: session.user.id }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])

  if (!subscription) notFound()

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Edit Subscription</h2>
      <SubscriptionForm
        categories={categories}
        defaultCategoryId={subscription.categoryId}
        defaultCurrency={user?.defaultCurrency ?? 'THB'}
        initialData={{
          id: subscription.id,
          name: subscription.name,
          description: subscription.description ?? undefined,
          cost: Number(subscription.cost),
          currency: subscription.currency,
          billingCycle: subscription.billingCycle,
          nextBillingDate: subscription.nextBillingDate,
          categoryId: subscription.categoryId,
          paymentMethod: subscription.paymentMethod ?? undefined,
          logoUrl: subscription.logoUrl ?? undefined,
          logoEmoji: subscription.logoEmoji ?? undefined,
          status: subscription.status,
          notes: subscription.notes ?? undefined,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 4: End-to-end test**

```bash
npm run dev
```

Test flow:
1. Go to `/subscriptions/new`
2. Fill in: name="Netflix", cost=279, cycle=MONTHLY, nextBillingDate=next month, category=Streaming, emoji=🎬
3. Submit — should redirect to `/subscriptions`
4. Click the card → edit form pre-filled
5. Change cost → Save
6. Dashboard shows updated totals

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/subscriptions/ components/subscription-form.tsx
git commit -m "feat: add subscription add/edit forms with Server Actions"
```

---

## Task 10: Settings Page

**Files:**
- Create: `lib/actions/settings.actions.ts`, `app/(app)/settings/page.tsx`

- [ ] **Step 1: Settings Server Action**

```ts
// lib/actions/settings.actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

const profileSchema = z.object({
  name: z.string().min(1),
  defaultCurrency: z.string().min(3).max(3).toUpperCase(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const parsed = profileSchema.parse(data)
  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed,
  })
  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function updatePassword(data: z.infer<typeof passwordSchema>) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const parsed = passwordSchema.parse(data)
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.password) throw new Error('No password set')

  const valid = await bcrypt.compare(parsed.currentPassword, user.password)
  if (!valid) throw new Error('Current password is incorrect')

  const hash = await bcrypt.hash(parsed.newPassword, 10)
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hash } })
}
```

- [ ] **Step 2: Settings page**

```tsx
// app/(app)/settings/page.tsx
'use client'
import { useState, useTransition } from 'react'
import { updateProfile, updatePassword } from '@/lib/actions/settings.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [pending, startTransition] = useTransition()
  const [profileMsg, setProfileMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateProfile({
          name: data.get('name') as string,
          defaultCurrency: data.get('defaultCurrency') as string,
        })
        setProfileMsg('Saved!')
      } catch {
        setProfileMsg('Failed to save')
      }
    })
  }

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updatePassword({
          currentPassword: data.get('currentPassword') as string,
          newPassword: data.get('newPassword') as string,
        })
        setPwMsg('Password updated!')
        ;(e.target as HTMLFormElement).reset()
      } catch (err: unknown) {
        setPwMsg(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleProfile} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={session?.user?.name ?? ''} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Input id="defaultCurrency" name="defaultCurrency" defaultValue="THB" placeholder="THB" maxLength={3} />
            </div>
            {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
            <Button type="submit" disabled={pending} size="sm">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePassword} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" />
            </div>
            {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
            <Button type="submit" disabled={pending} size="sm">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
        Sign Out
      </Button>
    </div>
  )
}
```

Note: Settings page is a Client Component to use `useSession` and `useTransition`.
Wrap the app layout with `SessionProvider` from `next-auth/react`:

```tsx
// app/(app)/layout.tsx — update to add SessionProvider
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
// ...
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      {/* existing layout */}
    </SessionProvider>
  )
}
```

- [ ] **Step 3: Verify settings**

```bash
npm run dev
```

Navigate to `/settings` — update name/currency, change password, sign out

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/settings/ lib/actions/settings.actions.ts
git commit -m "feat: add settings page with profile and password update"
```

---

## Task 11: Deployment Setup

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`

- [ ] **Step 1: Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Enable standalone output in `next.config.ts`:
```ts
const nextConfig = {
  output: 'standalone',
}
export default nextConfig
```

- [ ] **Step 2: docker-compose.yml**

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/subscriptions

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: subscriptions
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 3: .dockerignore**

```
node_modules
.next
.env
.env.local
.git
```

- [ ] **Step 4: Test Docker build**

```bash
docker compose build
docker compose up
```

Expected: App available at `http://localhost:3000`

- [ ] **Step 5: Final test run**

```bash
npm test
```

Expected: All utility tests pass

- [ ] **Step 6: Final commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore next.config.ts
git commit -m "feat: add Docker deployment setup"
```

---

## Done Checklist

- [ ] `npm test` — all utility tests pass
- [ ] Login works with credentials
- [ ] Can add subscription via FAB → form → submit
- [ ] Dashboard shows correct monthly/yearly totals
- [ ] Alert strip appears for subscriptions within 7 days
- [ ] Category filter tabs work on subscriptions page
- [ ] Settings saves defaultCurrency
- [ ] Docker Compose builds and runs
