import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { tryCatch } from "./tryCatch"

export const deleteImage = async (session: Session, imageUrl: string) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  const path = imageUrl.replace(/^\/+/, "") // remove leading slashes
  const { data, error } = await tryCatch(supabase.storage.from("images").remove([path]))

  if (error) {
    return { data: null, error: `Unexpected error: ${error.message}` }
  }
  if (data.error) {
    return { data: null, error: `Failed to delete image: ${data.error.message}` }
  }

  return { data, error }
}
