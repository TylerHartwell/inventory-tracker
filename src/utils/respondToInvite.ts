import { supabase } from "@/supabase-client"

export async function respondToInvite(inviteId: string, status: "accepted" | "declined") {
  const rpcName = status === "accepted" ? "accept_invite" : "decline_invite"

  const { error } = await supabase.rpc(rpcName, {
    p_invite_id: inviteId
  })

  if (error) throw error
}
