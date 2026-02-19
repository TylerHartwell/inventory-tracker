import { supabase } from "@/supabase-client"

export const generateSignedUrl = async (filePath: string): Promise<string | null> => {
  // Normalize path: remove leading/trailing slashes and whitespace
  const normalizedPath = filePath.trim().replace(/^\/+/, "").replace(/\/+$/, "")

  if (!normalizedPath) return null

  const expirySeconds = 60 * 20 // 20 minutes
  const { data, error } = await supabase.storage.from("images").createSignedUrl(normalizedPath, expirySeconds)

  if (error || !data) {
    if (error?.message !== "Object not found") {
      console.error("Signed URL error:", error?.message, "for path:", normalizedPath)
    }
    return null
  }

  return data.signedUrl
}
