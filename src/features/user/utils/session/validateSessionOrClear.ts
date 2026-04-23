import { Session } from "@supabase/supabase-js"
import { supabase } from "@/supabase-client"

export async function validateSessionOrClear(session: Session | null): Promise<Session | null> {
  if (!session) return null

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Clearing invalid persisted session", error)
    }
    await supabase.auth.signOut({ scope: "local" })
    return null
  }

  return session
}
