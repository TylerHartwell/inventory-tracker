import { ChangeEvent, useState } from "react"
import { MembersList } from "./MembersList"
import { insertListInvite } from "@/features/invites/utils/list-invite/insertListInvite"

import { UserList } from "@/features/lists/hooks/useUserLists"
import { Session } from "@supabase/supabase-js"

interface Props {
  configId: string
  session: Session
  currentList: UserList | undefined
  isOwner: boolean
}

const ListOwnerUserManager = ({ configId, session, currentList, isOwner }: Props) => {
  const [membersKey, setMembersKey] = useState(0)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [newUserEmail, setNewUserEmail] = useState("")

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUserEmail(e.target.value)
    if (e.target.value.toLowerCase() === session.user.email?.toLowerCase()) {
      setInviteError("You can't invite yourself")
      return
    }
    setInviteError(null)
  }

  const handleInvite = async (newRole: "editor" | "viewer") => {
    if (!newUserEmail || !currentList || !isOwner) return

    setInviteError(null)

    if (newUserEmail.toLowerCase() === session.user.email?.toLowerCase()) {
      setInviteError("You can't invite yourself")
      return
    }
    const { error } = await insertListInvite({
      listId: currentList.id,
      email: newUserEmail,
      role: newRole
    })
    if (error) {
      setInviteError(error)
      return
    }
    setNewUserEmail("")
    setMembersKey(k => k + 1)
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Invite form */}
      <form
        onSubmit={e => {
          e.preventDefault()
          if (!inviteError) {
            handleInvite("viewer")
          }
        }}
        className="flex gap-2"
      >
        <input
          name="email"
          type="email"
          placeholder="Enter email"
          autoComplete="off"
          autoFocus
          value={newUserEmail}
          onChange={handleEmailChange}
          className="flex-1 border rounded px-2 py-1"
        />

        <button
          type="submit"
          disabled={!!inviteError}
          className={`bg-blue-500 text-white px-4 py-1 rounded ${inviteError ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title="Send invite"
        >
          Invite
        </button>
      </form>
      {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}

      {/* Members list */}
      <MembersList key={membersKey} listId={configId} session={session} />
    </div>
  )
}

export default ListOwnerUserManager
