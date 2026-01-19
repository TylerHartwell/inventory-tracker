import { X, RefreshCw } from "lucide-react"
import { InvitesList } from "./InvitesList"
import { InviteWithListName } from "@/hooks/useUserInvites"
import { UsernameEditor } from "./UsernameEditor"
import { Session } from "@supabase/supabase-js"

interface UserSettingsProps {
  session: Session
  onLogout: () => Promise<void>
  onClose: () => void
  invitesState: {
    invites: InviteWithListName[]
    loading: boolean
    error: string | null
    fetchInvites: () => Promise<{ data: null; error: string | null }>
  }
}

const UserSettings = ({ session, onLogout, onClose, invitesState }: UserSettingsProps) => {
  const { loading, fetchInvites } = invitesState

  const hasInvites = invitesState.invites.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-sm rounded-xl bg-gray-700 p-3 shadow-lg flex flex-col gap-2" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <span>User Options</span>
          <button
            onClick={() => onClose()}
            className="rounded-lg size-5 hover:bg-gray-500 text-center flex items-center justify-center transition cursor-pointer"
          >
            <X />
          </button>
        </div>

        <UsernameEditor session={session} />

        <div className="border border-gray-400 rounded-md p-1 flex flex-col items-center">
          <div className="grid grid-cols-3  w-full">
            <span className="relative col-start-2">
              {hasInvites && <span className="absolute top-2 -left-3 w-1.75 h-1.75 bg-red-500 rounded-full border border-white"></span>}
              <span className=" text-center">Pending Invites</span>
            </span>

            <button onClick={() => fetchInvites()} className="cursor-pointer disabled:opacity-50" disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <InvitesList invitesState={invitesState} />
        </div>

        <div className="flex justify-center items-center">
          <button
            onClick={async () => {
              await onLogout()
              onClose()
            }}
            className="rounded-lg bg-red-500 px-4 py-2 w-max text-white hover:bg-red-600 transition cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
