import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings-form'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, defaultCurrency: true },
  })

  if (!user) redirect('/login')

  return (
    <SettingsForm
      userName={user.name ?? ''}
      defaultCurrency={user.defaultCurrency}
    />
  )
}
