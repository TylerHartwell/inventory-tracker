import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { List } from "@/components/ItemManager"

interface UpdateListParams {
  list: List
  session: Session
  updates: Partial<{ name: string }>
}

export const updateList = async ({
  list,
  session,
  updates
}: UpdateListParams): Promise<{ data: List; error: null } | { data: null; error: string }> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  // Map frontend naming to DB column names
  const mappedUpdates: Partial<{ name: string }> = {
    ...(updates.name !== undefined && { name: updates.name })
  }

  const { data, error } = await supabase.from("lists").update(mappedUpdates).eq("id", list.id).select("*").single()

  if (error) {
    return { data: null, error: `Error updating list: ${error.message}` }
  }

  return { data, error: null }
}
