import { logout } from '@/app/login/actions'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'

export default async function LogoutButton() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <form action={logout}>
      <Button type="submit" className="rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90">
        Log out
      </Button>
    </form>
  )
}