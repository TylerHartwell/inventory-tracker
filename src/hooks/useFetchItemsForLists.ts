import { nullListName } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { useCallback } from "react"

export const useFetchItemsForLists = (session: Session, generateSignedUrl: (filePath: string) => Promise<string | null>) => {
  return useCallback(
    async (listIds: (string | null)[], signal?: AbortSignal) => {
      if (signal?.aborted || listIds.length === 0) return []

      const nonNullListIds = listIds.filter((id): id is string => id !== null)
      const orConditions: string[] = []

      let query = supabase.from("items").select(`*,lists(name)`)

      if (listIds.includes(null)) {
        orConditions.push(`and(list_id.is.null,user_id.eq.${session.user.id})`)
      }

      if (nonNullListIds.length > 0) {
        orConditions.push(`list_id.in.(${nonNullListIds.join(",")})`)
      }

      if (orConditions.length > 0) query = query.or(orConditions.join(","))

      const { data, error } = await query.order("created_at", { ascending: true })

      if (error) throw error
      if (!data) return []

      // Optional delay simulation
      // await new Promise<void>((resolve, reject) => {
      //   const timeout = setTimeout(resolve, 1000)
      //   signal?.addEventListener("abort", () => {
      //     clearTimeout(timeout)
      //     reject(new DOMException("Aborted", "AbortError"))
      //   })
      // })

      const itemsWithListName = await Promise.all(
        data.map(async item => {
          if (signal?.aborted) return null

          const signedUrl = item.image_url ? await generateSignedUrl(item.image_url) : null

          const { lists, ...rest } = item // omit the nested lists object

          return {
            ...rest,
            signedUrl,
            listName: lists?.name ?? nullListName // flatten name into listName
          }
        })
      )

      return itemsWithListName.filter((i): i is NonNullable<typeof i> => i !== null)
    },
    [generateSignedUrl, session.user.id]
  )
}
