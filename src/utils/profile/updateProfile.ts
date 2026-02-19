import { Profile } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { camelize } from "../caseChanger"

interface UpdateProfileParams {
  userId: string
  newUsername: string
}

export const updateProfile = async ({
  userId,
  newUsername
}: UpdateProfileParams): Promise<
  | {
      data: Profile
      error: null
    }
  | { data: null; error: string }
> => {
  const { data: updatedProfileDb, error } = await supabase
    .from("profiles")
    .update({ username: newUsername })
    .match({ id: userId })
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
