import { supabase } from "@/supabase-client"

interface UploadImageParams {
  file: File
  itemId: string
}

// Maximum file size: 5MB (5242880 bytes) - matches Supabase bucket configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

export const uploadImage = async ({ file, itemId }: UploadImageParams) => {
  if (!file.type.startsWith("image/")) {
    return { data: null, error: "File is not an image" }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { data: null, error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }
  }

  if (file.size === 0) {
    return { data: null, error: "File is empty" }
  }

  const safeName = file.name.replace(/[^\w.-]/g, "_") // Sanitize file name
  const filePath = `${itemId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from("images").upload(filePath, file)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: filePath, error: null }
}

export const uploadImages = async ({ files, itemId }: { files: File[]; itemId: string }) => {
  if (!files.length) {
    return { data: [] as string[], error: null }
  }

  const uploadedPaths: string[] = []

  for (const file of files) {
    const { data, error } = await uploadImage({ file, itemId })

    if (error || !data) {
      return { data: null, error: error || "Image upload did not return a file path" }
    }

    uploadedPaths.push(data)
  }

  return { data: uploadedPaths, error: null }
}
