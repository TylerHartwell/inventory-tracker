import { supabase } from "@/supabase-client"
import { List } from "@/features/items/components/ItemManager"
import { camelize } from "@/shared/utils/caseChanger"

interface UpdateListParams {
  list: List
  updates: Partial<{ name: string }>
}

export const updateList = async ({ list, updates }: UpdateListParams): Promise<{ data: List; error: null } | { data: null; error: string }> => {
  // Map frontend naming to DB column names
  const mappedUpdates: Partial<{ name: string }> = {
    ...(updates.name !== undefined && { name: updates.name })
  }

  const { data: updatedListDb, error } = await supabase.from("lists").update(mappedUpdates).eq("id", list.id).select("*").single()

  if (error) {
    return { data: null, error: `Error updating list: ${error.message}` }
  }

  return { data: camelize(updatedListDb), error: null }
}
