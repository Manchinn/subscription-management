import { config } from 'dotenv'
config({ path: '.env.local' })
config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

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
