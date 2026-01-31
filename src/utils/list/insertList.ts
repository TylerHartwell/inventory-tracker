import { supabase } from "@/supabase-client"
import { List } from "@/components/ItemManager"
import { camelize } from "../camelize"

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
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  if (!listName.trim()) {
    return { data: null, error: "List name is required." }
  }

  const { data: insertedListDb, error } = await supabase.from("lists").insert({ name: listName, owner_id: user.id }).select("*").single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: camelize(insertedListDb), error: null }
}
