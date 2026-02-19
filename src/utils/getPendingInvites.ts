import { supabase } from "@/supabase-client"
import { camelize } from "./caseChanger"
import { ListInvite } from "@/components/ItemManager"

export const getPendingInvites = async (): Promise<
  | { data: ListInvite[]; error: null }
  | {
      data: null
      error: string
    }
> => {
  const { data: pendingInvitesDb, error } = await supabase.from("list_invites").select("*").eq("status", "pending")

  if (error) {
    return { data: null, error: error.message }
  }
  return { data: camelize(pendingInvitesDb) ?? ([] as ListInvite[]), error: null }
}
