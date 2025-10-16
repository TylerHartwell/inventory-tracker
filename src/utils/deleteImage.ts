import { LocalItem } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"

interface DeleteImageProps {
  session: Session
  imageUrl: LocalItem["image_url"]
}

export const deleteImage = async ({ session, imageUrl }: DeleteImageProps) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  if (!imageUrl) {
    return { data: null, error: "Missing image url" }
  }

  const path = imageUrl.replace(/^\/+/, "") // remove leading slashes
  const { error, data } = await supabase.storage.from("images").remove([path])

  if (error) {
    return { data: null, error: `Failed to remove image: ${error.message}` }
  }

  return { data: data, error: null }
}
