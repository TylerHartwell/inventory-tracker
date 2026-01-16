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

  const path = imageUrl.replace(/^\/+/, "") // Remove leading slashes

  if (path.includes("..") || path.includes("//")) {
    return { data: null, error: "Invalid image path: path traversal detected" }
  }

  const segments = path.split("/")
  const folder = segments[0]

  if (folder === "users") {
    const userId = segments[1]
    if (userId !== session.user.id) {
      return { data: null, error: "Cannot delete another user's personal image" }
    }
  } else if (folder === "lists") {
    const listId = segments[1]
    const { data: listUser, error } = await supabase
      .from("list_users")
      .select("*")
      .eq("list_id", listId)
      .eq("user_id", session.user.id)
      .in("role", ["owner", "editor"])
      .single()

    if (error || !listUser) {
      return { data: null, error: "You do not have permission to delete this list image" }
    }
  } else {
    return { data: null, error: "Invalid image path folder" }
  }

  const { error, data } = await supabase.storage.from("images").remove([path])

  if (error) {
    return { data: null, error: `Failed to remove image: ${error.message}` }
  }

  return { data: data, error: null }
}
