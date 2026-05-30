import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Menu } from '@/components/app/menu'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const email = user.email ?? ''
  const derivedName = "dummyName"

  return (
    <SidebarProvider>
      <Menu userName={derivedName} userEmail={email} />
      <main className="flex-1 flex flex-col">
        <div className="px-8 pt-4 pb-4">
          <SidebarTrigger />
        </div>
        <div className="flex-1 px-8 pb-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}