import { Profile } from "@/features/items/components/ItemManager"
import { supabase } from "@/supabase-client"
import { camelize } from "@/shared/utils/caseChanger"

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
    if (error.code === "23514") {
      return { data: null, error: "Username must be at least 3 characters" }
    }
    return { data: null, error: `Error updating invite role: ${error.message}` }
  }

  return { data: camelize(updatedProfileDb), error: null }
}
