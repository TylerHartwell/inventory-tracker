import { Item } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"

interface DeleteImageProps {
  imageUrl: Item["imageUrl"]
}

export const deleteImageFileByUrl = async ({ imageUrl }: DeleteImageProps) => {
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
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

  // Validate path has expected structure
  if (segments.length < 3) {
    return { data: null, error: "Invalid image path structure: expected 'folder/id/...' format" }
  }

  const folder = segments[0]

  if (folder === "users") {
    const userId = segments[1]
    if (userId !== user.id) {
      return { data: null, error: "Cannot delete another user's personal image" }
    }
  } else if (folder === "lists") {
    const listId = segments[1]
    const { data: listUser, error } = await supabase
      .from("list_users")
      .select("*")
      .eq("list_id", listId)
      .eq("user_id", user.id)
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

  // Verify deletion was successful
  if (!data || data.length === 0) {
    console.warn("Warning: Storage delete appeared to succeed but returned no data for path:", path)
    return { data: null, error: `Failed to verify image deletion for path: ${path}` }
  }

  return { data: data, error: null }
}
