import { supabase } from "@/supabase-client"

interface UploadImageParams {
  file: File
  itemId: string
  listId: string | null
}

// Maximum file size: 5MB (5242880 bytes) - matches Supabase bucket configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

export const uploadImage = async ({ file, itemId, listId }: UploadImageParams) => {
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  if (!file.type.startsWith("image/")) {
    return { data: null, error: "File is not an image" }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { data: null, error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }
  }

  if (file.size === 0) {
    return { data: null, error: "File is empty" }
  }

  const basePath = listId ? `lists/${listId}/${itemId}` : `users/${user.id}/${itemId}`
  const safeName = file.name.replace(/[^\w.-]/g, "_") // Sanitize file name
  const filePath = `${basePath}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from("images").upload(filePath, file, {
    upsert: false
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: filePath, error: null }
}
