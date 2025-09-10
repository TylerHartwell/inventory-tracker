import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"

export const uploadImage = async (session: Session, file: File): Promise<string | null> => {
  if (!session.user) {
    console.error("Not authenticated")
    return null
  }

  if (!file.type.startsWith("image/")) {
    console.error("File is not an image")
    return null
  }

  const filePath = `${session.user.id}/${Date.now()}-${file.name}`

  try {
    const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading image:", uploadError.message)
      return null
    }

    return filePath
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Unexpected error:", err.message)
    } else {
      console.error("Unexpected error:", err)
    }
    return null
  }
}
