import { supabase } from "@/supabase-client"
import { useCallback } from "react"

export const useGenerateSignedUrl = () => {
  return useCallback(async (filePath?: string | null): Promise<string | null> => {
    if (!filePath) return null

    const expirySeconds = 60 * 20 //20 minutes
    const { data, error } = await supabase.storage.from("images").createSignedUrl(filePath, expirySeconds)

    if (error || !data) {
      console.error("Signed URL error:", error?.message)
      return null
    }

    return data.signedUrl
  }, [])
}
