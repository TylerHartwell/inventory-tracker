import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"

export const deleteImage = async (session: Session, imageUrl: string) => {
  if (!session.user) {
    console.error("Not authenticated")
    return null
  }
  try {
    if (imageUrl) {
      const { error: storageError } = await supabase.storage.from("tasks-images").remove([imageUrl])

      if (storageError) {
        console.error("Error deleting image:", storageError.message)
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}
