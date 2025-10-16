import { Session } from "@supabase/supabase-js"
import { supabase } from "@/supabase-client"
import { List } from "@/components/ItemManager"

export interface InsertListParams {
  session: Session
  listName: List["name"]
}

export const insertList = async ({
  session,
  listName
}: InsertListParams): Promise<
  | { data: List; error: null }
  | {
      data: null
      error: string
    }
> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  if (!listName.trim()) {
    return { data: null, error: "List name is required." }
  }

  const { data, error } = await supabase.from("lists").insert({ name: listName, owner_id: session.user.id }).select("*").single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}
