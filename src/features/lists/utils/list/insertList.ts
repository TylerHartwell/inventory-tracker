import { supabase } from "@/supabase-client"
import { List } from "@/features/items/components/ItemManager"
import { camelize } from "@/shared/utils/caseChanger"

export interface InsertListParams {
  listName: List["name"]
}

export const insertList = async ({
  listName
}: InsertListParams): Promise<
  | { data: List; error: null }
  | {
      data: null
      error: string
    }
> => {
  if (!listName.trim()) {
    return { data: null, error: "List name is required." }
  }

  const { data: insertedListDb, error } = await supabase.from("lists").insert({ name: listName }).select("*").single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: camelize(insertedListDb), error: null }
}
