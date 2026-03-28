# Breaking Changes & Bugs Found — Subscription Tracker
**Date:** 2026-03-28
**Project:** Subscription Management Tracker
**Author:** Chinnakrit

---

## Context — Stack ที่ติดตั้งจริง vs ที่วางแผนไว้

| Package | ที่วางแผน | ที่ติดตั้งจริง | หมายเหตุ |
|---|---|---|---|
| Prisma | v5.x | **v7.x** | Breaking changes หลายจุด |
| NextAuth | v4.x | **v5 (beta.30)** | Rename + split config |
| Next.js | v14/15 | **v16** | middleware → proxy.ts, async params |
| shadcn/ui | Radix-based | **Base UI-based** | `@base-ui/react` แทน `@radix-ui` |
| Tailwind CSS | v3 | **v4** | ไม่ต้องใช้ `tailwind.config.ts` |

ปัญหาส่วนใหญ่เกิดจาก major version bump ที่ไม่ได้คาดการณ์ไว้ตอน initiate project

---

## 1. Prisma 7 Breaking Changes

### 1.1 `url = env("DATABASE_URL")` ใน `schema.prisma` ไม่ทำงานอีกต่อไป

**ปัญหา:** Prisma 7 เลิก support การ inline datasource config ใน `schema.prisma` แบบเดิม

**Root cause:** Architecture เปลี่ยนไปใช้ config file แยกต่างหาก

**วิธีแก้:** สร้าง `prisma.config.ts` ที่ root แล้วใช้ `defineConfig`:

```ts
// prisma.config.ts
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

### 1.2 `new PrismaClient()` โดยไม่ส่ง options จะ throw error

**ปัญหา:** Instantiate `PrismaClient` แบบเปล่าๆ ไม่ได้อีกแล้ว

**Root cause:** Prisma 7 บังคับใช้ driver adapter แทน built-in connection

**วิธีแก้:** ติดตั้ง `@prisma/adapter-pg` และ `pg` แล้วส่ง adapter เข้าไป:

```ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })
```

**Packages ที่ต้องติดตั้งเพิ่ม:**
```bash
npm install @prisma/adapter-pg pg
npm install -D @types/pg
```

---

### 1.3 Seed config ย้ายจาก `package.json` ไปที่ `prisma.config.ts`

**ปัญหา:** `"prisma": { "seed": "..." }` ใน `package.json` ถูก deprecated

**Root cause:** Prisma รวม seed config เข้า `prisma.config.ts` เพื่อ centralize configuration

**วิธีแก้:**

```ts
// prisma.config.ts
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL! },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
})
```

---

### 1.4 Seed script ต้อง load dotenv เองและส่ง `datasourceUrl` ชัดเจน

**ปัญหา:** Seed script รันผ่าน `tsx` แล้ว `process.env.DATABASE_URL` เป็น `undefined`

**Root cause:** `tsx` ไม่ auto-load `.env` และ Prisma 7 ไม่ inject env ให้ seed script อีกต่อไป

**วิธีแก้:** Load dotenv ด้วยตัวเอง และส่ง `datasourceUrl` ตรงๆ:

```ts
// prisma/seed.ts
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter, datasourceUrl: process.env.DATABASE_URL })
```

---

### 1.5 Prisma `Decimal` import path เปลี่ยน

**ปัญหา:** `import { Decimal } from '@prisma/client/runtime/library'` ทำให้ TypeScript error

**Root cause:** Prisma 7 ย้าย runtime export path

**วิธีแก้:**
```ts
// แก้จาก
import { Decimal } from '@prisma/client/runtime/library'
// เป็น
import { Decimal } from '@prisma/client/runtime/client'
```

---

### 1.6 `@@unique` compound constraint ที่มี nullable field ใช้ `upsert` ไม่ได้

**ปัญหา:** `prisma.subscription.upsert({ where: { userId_serviceId: ... } })` throw error เมื่อ field ใดใน compound key เป็น nullable

**Root cause:** Prisma ไม่รองรับ `upsert` บน `@@unique` ที่มี nullable field เพราะ NULL != NULL ใน SQL semantics

**วิธีแก้:** ใช้ `findFirst` + conditional `create`/`update` แทน:

```ts
const existing = await prisma.subscription.findFirst({
  where: { userId, serviceId },
})

if (existing) {
  await prisma.subscription.update({ where: { id: existing.id }, data: { ... } })
} else {
  await prisma.subscription.create({ data: { userId, serviceId, ... } })
}
```

---

## 2. NextAuth v5 (beta.30) Breaking Changes

### 2.1 Environment variables ถูก rename

**ปัญหา:** App ไม่ authenticate ได้เลย ไม่มี error ชัดเจน

**Root cause:** NextAuth v5 เปลี่ยนชื่อ env vars

**วิธีแก้:**

```bash
# แก้จาก
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000

# เป็น
AUTH_SECRET=xxx
AUTH_URL=http://localhost:3000
```

---

### 2.2 Credentials provider ต้องระบุ `session: { strategy: 'jwt' }` ชัดเจน

**ปัญหา:** Login ด้วย credentials แล้ว session ไม่ถูก persist — error เกี่ยวกับ database session

**Root cause:** `PrismaAdapter` default เป็น database session strategy แต่ Credentials provider ใช้ได้แค่ JWT

**วิธีแก้:**

```ts
// lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' }, // ต้องระบุชัดเจน
  providers: [Credentials({ ... })],
})
```

---

### 2.3 Edge runtime: ต้องใช้ split config pattern

**ปัญหา:** `proxy.ts` (middleware) import `bcrypt` หรือ `PrismaClient` แล้ว crash เพราะ Edge runtime ไม่รองรับ Node.js APIs

**Root cause:** NextAuth v5 handler ที่มี bcrypt/Prisma ไม่สามารถรันใน Edge runtime ได้

**วิธีแก้:** แยก config ออกเป็น 2 ไฟล์:

```ts
// auth.config.ts — ใช้ใน proxy.ts (Edge-safe เท่านั้น)
import type { NextAuthConfig } from 'next-auth'
export default {
  providers: [], // ไม่มี Credentials, ไม่มี bcrypt, ไม่มี Prisma
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
  },
} satisfies NextAuthConfig
```

```ts
// lib/auth.ts — ใช้ใน Server Components / API routes (Node.js)
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import authConfig from '@/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [Credentials({ /* bcrypt ที่นี่ได้ */ })],
})
```

---

### 2.4 Session callback: ใช้ type guard แทน type cast

**ปัญหา:** TypeScript error เมื่อใช้ `token.id as string` ใน session callback

**Root cause:** `token.id` type เป็น `unknown` ใน JWT token

**วิธีแก้:**

```ts
// แก้จาก
session.user.id = token.id as string

// เป็น
if (typeof token.id === 'string') {
  session.user.id = token.id
}
```

---

## 3. Next.js 16 Breaking Changes

### 3.1 `middleware.ts` ถูก deprecated → เปลี่ยนเป็น `proxy.ts`

**ปัญหา:** ไฟล์ `middleware.ts` ไม่ถูก recognize โดย Next.js 16

**Root cause:** Next.js 16 rename middleware file เพื่อสะท้อน role ที่ชัดเจนขึ้น

**วิธีแก้:** Rename `middleware.ts` → `proxy.ts` ที่ root ของ project

---

### 3.2 Route handler `params` เป็น `Promise<Params>` แล้ว

**ปัญหา:** `params.id` ใน route handler ทำให้ TypeScript error และ runtime error

**Root cause:** Next.js 16 เปลี่ยน `params` เป็น async เพื่อรองรับ streaming

**วิธีแก้:** ต้อง `await` params และ wrap NextAuth handlers:

```ts
// app/api/[...nextauth]/route.ts
import { handlers } from '@/lib/auth'

type Context = { params: Promise<{ nextauth: string[] }> }

export async function GET(req: Request, _ctx: Context) {
  return handlers.GET(req)
}

export async function POST(req: Request, _ctx: Context) {
  return handlers.POST(req)
}
```

สำหรับ route handler ทั่วไป:

```ts
// app/api/subscriptions/[id]/route.ts
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params  // ต้อง await
  // ...
}
```

---

## 4. shadcn/ui — Base UI แทน Radix UI

### 4.1 shadcn ใหม่ใช้ `@base-ui/react` แทน `@radix-ui`

**ปัญหา:** ลง shadcn แล้วเห็น `@base-ui/react` ใน `node_modules` ไม่ใช่ `@radix-ui`

**Root cause:** `npx shadcn@latest` version ใหม่ migrate ไป Base UI แล้ว

**Impact:** API ของ components บางตัวเปลี่ยน — ต้องอ่าน Base UI docs แทน Radix UI docs

---

### 4.2 Base UI Select `onValueChange` types value เป็น `string | null`

**ปัญหา:** TypeScript error เมื่อส่ง `string` ไปใน setter ที่รับ `string | null`

**Root cause:** Base UI ยอมรับ null value สำหรับ unselected state

**วิธีแก้:** ใส่ null guard ก่อน set:

```tsx
// แก้จาก
<Select onValueChange={(v) => setValue(v)}>

// เป็น
<Select onValueChange={(v) => { if (v) setValue(v) }}>
```

---

### 4.3 Tailwind v4 ไม่ต้องใช้ `tailwind.config.ts`

**ปัญหา:** สร้าง `tailwind.config.ts` แล้ว config ถูก ignore หรือ conflict

**Root cause:** Tailwind v4 ย้าย config เข้า CSS โดยตรง

**วิธีแก้:** ลบ `tailwind.config.ts` แล้วใช้ CSS config แทน:

```css
/* app/globals.css */
@import "tailwindcss";
@theme {
  --color-primary: oklch(0.6 0.2 250);
  /* custom tokens ที่นี่ */
}
```

---

## 5. React Hook Form + Zod

### 5.1 `z.coerce.number()` / `z.coerce.date()` เกิด type mismatch กับ `zodResolver`

**ปัญหา:** TypeScript error ว่า schema type ไม่ตรงกับ `FormData` type ที่ประกาศไว้

**Root cause:** `z.coerce.*` เปลี่ยน inferred type ทำให้ `zodResolver` return type ไม่ match กับ generic ที่ `useForm` คาดหวัง

**วิธีแก้:** Cast resolver ชัดเจน:

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'

type FormData = z.infer<typeof schema>

const form = useForm<FormData>({
  resolver: zodResolver(schema) as Resolver<FormData>,
})
```

---

## 6. Other Issues

### 6.1 `tsx` command ไม่อยู่ใน PATH บน Windows

**ปัญหา:** Prisma seed fail ด้วย error ว่า `tsx: command not found`

**Root cause:** `tsx` ติดตั้งเป็น local dev dependency ไม่ได้ global

**วิธีแก้:** ใช้ `npx tsx` แทนใน seed config:

```ts
// prisma.config.ts
migrations: {
  seed: 'npx tsx prisma/seed.ts',
}
```

---

### 6.2 Git root อยู่ที่ home directory แทน project folder

**ปัญหา:** `git status` แสดงไฟล์ทั้งหมดใน `C:\Users\chinn\` รวมถึง AppData, Documents, ฯลฯ

**Root cause:** `git init` ถูกรันที่ `C:\Users\chinn\` โดยไม่ได้ตั้งใจ ทำให้ git repo ครอบ home directory ทั้งหมด

**วิธีแก้:** สร้าง standalone repo ใหม่ที่ project folder:

```bash
# 1. ลบ .git ที่ home (ระวัง!)
rm -rf /mnt/c/Users/chinn/.git

# 2. init ใหม่ที่ project
cd /mnt/c/Users/chinn/subscription-management
git init
git add .
git commit -m "feat: initial commit"
```

---

## Lessons Learned

1. **Pin major versions ก่อน init project** — `npm install prisma@5` ไม่ใช่ `npm install prisma` เพราะ latest อาจ jump ไป major ที่ breaking

2. **อ่าน migration guide ก่อนลงมือ** — Prisma 7, NextAuth v5, Next.js 16 ล้วนมี official migration guide ที่ครอบคลุมทุก breaking change ที่เจอ

3. **Separate concerns ตั้งแต่ต้น** — NextAuth split config pattern ควร setup จากวันแรก ไม่ใช่แก้ตอน Edge runtime ล้มเหลว

4. **ตรวจสอบ git root ก่อน `git init`** — รัน `git rev-parse --show-toplevel` เพื่อยืนยันว่า init ในตำแหน่งที่ถูกต้อง

5. **Seed scripts ต้องจัดการ env ด้วยตัวเอง** — อย่าพึ่ง framework inject env ให้ — `import 'dotenv/config'` ที่บรรทัดแรกเสมอ

6. **Type cast vs type guard** — ในงาน production ควรใช้ type guard (`typeof x === 'string'`) เสมอ ไม่ใช่ `as string` เพราะ guard ป้องกัน runtime error ด้วย

7. **shadcn ลง Base UI แล้ว** — component API เปลี่ยน ต้องอ่าน [base-ui.com](https://base-ui.com) ไม่ใช่ Radix UI docs อีกต่อไป
