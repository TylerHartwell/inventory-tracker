import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { tryCatch } from "./tryCatch"

export const uploadImage = async (session: Session, file: File) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  if (!file.type.startsWith("image/")) {
    return { data: null, error: "File is not an image" }
  }

  const filePath = `${session.user.id}/${Date.now()}-${file.name}`

  const { data, error } = await tryCatch(supabase.storage.from("images").upload(filePath, file))

  if (error) {
    return { data: null, error: `Unexpected error: ${error.message}` }
  }
  if (data.error) {
    return { data: null, error: data.error.message }
  }

  return { data: filePath, error: null }
}
