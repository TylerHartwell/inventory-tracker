import { supabase } from "@/supabase-client"

interface DeleteImageProps {
  imageUrl: string | null | undefined
}

export const deleteImageFileByUrl = async ({ imageUrl }: DeleteImageProps) => {
  if (!imageUrl) {
    return { data: null, error: "Missing image url" }
  }

  const path = imageUrl.replace(/^\/+/, "") // Remove leading slashes

  if (path.includes("..") || path.includes("//")) {
    return { data: null, error: "Invalid image path: path traversal detected" }
  }

  const segments = path.split("/")

  if (segments.length < 2) {
    return { data: null, error: "Invalid image path structure" }
  }

  const { error, data } = await supabase.storage.from("images").remove([path])

  if (error || !data || data.length === 0) {
    return { data: null, error: error ? `Failed to remove image: ${error.message}` : `Failed to verify image deletion for path: ${path}` }
  }

  return { data: data, error: null }
}
