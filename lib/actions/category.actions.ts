'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { categorySchema, type CategoryFormData } from '@/lib/validations/category'
import type { ActionResult } from '@/lib/actions/subscription.actions'

const MAX_USER_CATEGORIES = 20

async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function revalidateCategoryPaths() {
  revalidatePath('/settings/categories')
  revalidatePath('/settings')
  revalidatePath('/subscriptions/new')
  revalidatePath('/subscriptions')
  revalidatePath('/dashboard')
}

export async function createCategory(
  data: CategoryFormData
): Promise<ActionResult> {
  try {
    const userId = await requireUserId()
    const parsed = categorySchema.safeParse(data)

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    // Check max user categories
    const count = await prisma.category.count({ where: { userId } })
    if (count >= MAX_USER_CATEGORIES) {
      return { success: false, error: `Maximum ${MAX_USER_CATEGORIES} custom categories reached` }
    }

    let slug = generateSlug(parsed.data.name)

    // Check slug uniqueness for this user
    const existing = await prisma.category.findUnique({
      where: { slug_userId: { slug, userId } },
    })

    if (existing) {
      // Append random suffix
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    }

    await prisma.category.create({
      data: {
        name: parsed.data.name,
        icon: parsed.data.icon,
        color: parsed.data.color,
        slug,
        userId,
      },
    })

    revalidateCategoryPaths()
    return { success: true }
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('createCategory error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}

export async function updateCategory(
  id: string,
  data: CategoryFormData
): Promise<ActionResult> {
  try {
    const userId = await requireUserId()
    const parsed = categorySchema.safeParse(data)

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    // Verify ownership — only user-owned categories can be edited
    const category = await prisma.category.findFirst({
      where: { id, userId },
    })

    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    // Global categories (userId=null) cannot be edited — already excluded by where clause above

    let slug = generateSlug(parsed.data.name)

    // Check slug uniqueness (exclude current category)
    const existing = await prisma.category.findFirst({
      where: { slug, userId, id: { not: id } },
    })

    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    }

    await prisma.category.update({
      where: { id, userId },
      data: {
        name: parsed.data.name,
        icon: parsed.data.icon,
        color: parsed.data.color,
        slug,
      },
    })

    revalidateCategoryPaths()
    return { success: true }
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('updateCategory error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}

export async function deleteCategory(
  id: string
): Promise<ActionResult> {
  try {
    const userId = await requireUserId()

    // Verify ownership
    const category = await prisma.category.findFirst({
      where: { id, userId },
    })

    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    // Check if any subscriptions reference this category
    const subCount = await prisma.subscription.count({
      where: { categoryId: id, userId },
    })

    if (subCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${subCount} subscription${subCount > 1 ? 's' : ''} using this category`,
      }
    }

    await prisma.category.delete({ where: { id, userId } })

    revalidateCategoryPaths()
    return { success: true }
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('deleteCategory error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}
