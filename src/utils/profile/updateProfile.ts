import { Profile } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { camelize } from "../camelize"

interface UpdateProfileParams {
  newUsername: string
}

export const updateProfile = async ({
  newUsername
}: UpdateProfileParams): Promise<
  | {
      data: Profile
      error: null
    }
  | { data: null; error: string }
> => {
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data: updatedProfileDb, error } = await supabase
    .from("profiles")
    .update({ username: newUsername })
    .match({ id: user.id })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "Username already taken" }
    }
    return { data: null, error: `Error updating invite role: ${error.message}` }
  }

  return { data: camelize(updatedProfileDb), error: null }
}
