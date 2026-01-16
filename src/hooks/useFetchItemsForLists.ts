import { Item, List, nullListName } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { PostgrestResponse, Session } from "@supabase/supabase-js"
import { useCallback } from "react"

type ItemWithList = Item & {
  lists: Pick<List, "name"> | null
}

export const useFetchItemsForLists = (session: Session, generateSignedUrl: (filePath: string) => Promise<string | null>) => {
  return useCallback(
    async (listIds: (string | null)[], signal?: AbortSignal) => {
      if (signal?.aborted || listIds.length === 0) return []

      const nonNullListIds = listIds.filter((id): id is string => id !== null)

      const queryPromises: Promise<PostgrestResponse<ItemWithList>>[] = []

      if (listIds.includes(null)) {
        queryPromises.push(
          (async () =>
            supabase
              .from("items")
              .select("*, lists(name)")
              .is("list_id", null)
              .eq("user_id", session.user.id)
              .order("created_at", { ascending: true }))()
        )
      }

      if (nonNullListIds.length > 0) {
        queryPromises.push(
          (async () => supabase.from("items").select("*, lists(name)").in("list_id", nonNullListIds).order("created_at", { ascending: true }))()
        )
      }

      const results = await Promise.all(queryPromises)

      for (const result of results) {
        if (result.error) throw result.error
      }

      const allData = results.flatMap(result => result.data || [])

      const itemsWithListName = await Promise.all(
        allData.map(async item => {
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
