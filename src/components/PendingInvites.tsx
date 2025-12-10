import { useEffect, useState } from "react"
import { supabase } from "@/supabase-client"
import { getPendingInvites, ListInvitePending } from "@/utils/getPendingInvites"

export const PendingInvites = () => {
  const [invites, setInvites] = useState<ListInvitePending[]>([])

  useEffect(() => {
    getPendingInvites().then(setInvites).catch(console.error)
  }, [])

  const handleAccept = async (inviteId: string) => {
    const { error } = await supabase.rpc("accept_invite", { p_invite_id: inviteId })
    if (error) {
      alert(`Error accepting invite: ${error.message}`)
      return
    }
    setInvites(invites.filter(i => i.id !== inviteId)) // remove from UI
  }

  const handleDecline = async (inviteId: string) => {
    const { error } = await supabase.rpc("decline_invite", { p_invite_id: inviteId })
    if (error) {
      alert(`Error declining invite: ${error.message}`)
      return
    }
    setInvites(invites.filter(i => i.id !== inviteId)) // remove from UI
  }

  if (!invites.length) return <div>No pending invitations.</div>

  return (
    <div>
      <h2>Pending Invitations</h2>
      <ul>
        {invites.map(invite => (
          <li key={invite.id}>
            {invite.email} — {invite.role}
            <button onClick={() => handleAccept(invite.id)}>Accept</button>
            <button onClick={() => handleDecline(invite.id)}>Decline</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
