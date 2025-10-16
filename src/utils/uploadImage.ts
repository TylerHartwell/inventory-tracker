import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"

interface UploadImageParams {
  session: Session
  file: File
}

export const uploadImage = async ({ session, file }: UploadImageParams) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  if (!file.type.startsWith("image/")) {
    return { data: null, error: "File is not an image" }
  }

  const filePath = `${session.user.id}/${Date.now()}-${file.name}`

  const { error } = await supabase.storage.from("images").upload(filePath, file)

  if (error) {
    return { data: null, error: `Unexpected error: ${error.message}` }
  }

  return { data: filePath, error: null }
}
