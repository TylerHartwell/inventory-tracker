import { Profile } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"

interface UpdateProfileParams {
  session: Session
  newUsername: string
}

export const updateProfile = async ({
  session,
  newUsername
}: UpdateProfileParams): Promise<
  | {
      data: Profile
      error: null
    }
  | { data: null; error: string }
> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase.from("profiles").update({ username: newUsername }).match({ id: session.user.id }).select("*").single()

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "Username already taken" }
    }
    return { data: null, error: `Error updating invite role: ${error.message}` }
  }

  return { data, error: null }
}
