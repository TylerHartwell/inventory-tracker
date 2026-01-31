import { InviteWithListName } from "@/hooks/useUserInvites"
import { respondToInvite } from "@/utils/respondToInvite"

interface InvitesListProps {
  invitesState: {
    invites: InviteWithListName[]
    loading: boolean
    error: string | null
    fetchInvites: () => Promise<{ data: null; error: string | null }>
  }
  spinning: boolean
}

export function InvitesList({ invitesState, spinning }: InvitesListProps) {
  const { invites, error, fetchInvites } = invitesState

  if (spinning) return <p>Loading invites…</p>
  if (error) return <p>Error: {error}</p>

  if (invites.length === 0) {
    return <span>- No Invites -</span>
  }

  const handleRespond = async (inviteId: string, status: "accepted" | "declined") => {
    const { error: responseError } = await respondToInvite(inviteId, status)

    if (responseError) {
      console.error("Error responding to invite:", responseError)
      return
    }

    // Re-fetch the invites so UI updates
    const { error: fetchError } = await fetchInvites()
    if (fetchError) {
      console.error("Error fetching invites:", fetchError)
      return
    }
  }

  return (
    <ul className="w-full flex flex-col gap-2">
      {invites.map(invite => (
        <li key={invite.id} className="flex justify-between items-center border rounded-md border-gray-500 px-2">
          <div className="flex flex-col justify-between">
            <span>List: {invite.list?.name ?? "Unknown list"}</span>
            <span>Role: {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}</span>
          </div>
          <span className="flex gap-2 text-md">
            <button className="border rounded-full px-2 cursor-pointer" onClick={() => handleRespond(invite.id, "accepted")}>
              Accept
            </button>
            <button className="border rounded-full px-2 cursor-pointer" onClick={() => handleRespond(invite.id, "declined")}>
              Decline
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}
