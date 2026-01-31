import { supabase } from "@/supabase-client"
import { camelize } from "./camelize"
import { ListMember } from "@/components/ItemManager"

export const getListMembers = async (
  listId: string
): Promise<
  | { data: ListMember[]; error: null }
  | {
      data: null
      error: string
    }
> => {
  const { data: listMembersDb, error } = await supabase.from("list_members").select("*").eq("list_id", listId).order("pending", { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: camelize(listMembersDb) ?? ([] as ListMember[]), error: null }
}
