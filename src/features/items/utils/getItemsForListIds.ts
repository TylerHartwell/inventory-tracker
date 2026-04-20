import { DBItem, DBItemImage, List, LocalItem, nullListName } from "@/features/items/components/ItemManager"
import { supabase } from "@/supabase-client"
import { camelize } from "@/shared/utils/caseChanger"
import { generateSignedUrls } from "@/shared/utils/generateSignedUrl"
import { PostgrestResponse } from "@supabase/supabase-js"

type DBItemWithList = DBItem & {
  lists: Pick<List, "name"> | null
  item_images: Pick<DBItemImage, "id" | "image_url" | "display_order" | "created_at">[] | null
}

export const getItemsForListIds = async (userId: string, listIds: (string | null)[], signal?: AbortSignal): Promise<LocalItem[]> => {
  if (signal?.aborted || listIds.length === 0) return []

  const nonNullListIds = listIds.filter((id): id is string => id !== null)
  let authorizedListIds: string[] = []
  const canEditByListId = new Map<string, boolean>()

  if (nonNullListIds.length > 0) {
    const { data: listUsers, error: listUsersError } = await supabase
      .from("list_users")
      .select("list_id, role")
      .eq("user_id", userId)
      .in("list_id", nonNullListIds)

    if (listUsersError) throw listUsersError

    authorizedListIds = listUsers?.map(listUser => listUser.list_id) ?? []

    listUsers?.forEach(listUser => {
      canEditByListId.set(listUser.list_id, listUser.role !== "viewer")
    })
  }

  const queryPromises: Promise<PostgrestResponse<DBItemWithList>>[] = []

  if (listIds.includes(null)) {
    queryPromises.push(
      (async () =>
        supabase
          .from("items")
          .select("*, lists(name), item_images(id, image_url, display_order, created_at)")
          .is("list_id", null)
          .eq("user_id", userId)
          .order("created_at", { ascending: true }))()
    )
  }

  if (authorizedListIds.length > 0) {
    queryPromises.push(
      (async () =>
        supabase
          .from("items")
          .select("*, lists(name), item_images(id, image_url, display_order, created_at)")
          .in("list_id", authorizedListIds)
          .order("created_at", { ascending: true }))()
    )
  }

  const results = await Promise.all(queryPromises)

  for (const result of results) {
    if (result.error) throw result.error
  }

  const allDataDb = results.flatMap(result => result.data || [])
  const allData = camelize(allDataDb)

  const localItems = await Promise.all(
    allData.map(async item => {
      if (signal?.aborted) return null
      const imageRows = [...(item.itemImages ?? [])].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder
        }

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

      const imageUrls = imageRows.map(imageRow => imageRow.imageUrl)
      const imageIds = imageRows.map(imageRow => imageRow.id)
      const signedUrls = await generateSignedUrls(imageUrls)
      const { lists, ...rest } = item
      return {
        ...rest,
        imageUrls,
        imageIds,
        signedUrls,
        listName: lists?.name ?? nullListName,
        canEdit: item.listId ? (canEditByListId.get(item.listId) ?? false) : true
      }
    })
  )

  return localItems.filter((i): i is NonNullable<typeof i> => i !== null)
}
