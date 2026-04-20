import { supabase } from "@/supabase-client"

export async function respondToInvite(inviteId: string, status: "accepted" | "declined"): Promise<{ data: null; error: string | null }> {
  const rpcName = status === "accepted" ? "accept_invite" : "decline_invite"

  const { error } = await supabase.rpc(rpcName, {
    p_invite_id: inviteId
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}
