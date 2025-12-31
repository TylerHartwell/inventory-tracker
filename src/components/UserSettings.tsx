import { X, RefreshCw } from "lucide-react"
import { InvitesList } from "./InvitesList"
import { InviteWithListName } from "@/hooks/useUserInvites"

interface UserSettingsProps {
  onLogout: () => Promise<void>
  onClose: () => void
  invitesState: {
    invites: InviteWithListName[]
    loading: boolean
    error: string | null
    refetchInvites: () => Promise<void>
  }
}

const UserSettings = ({ onLogout, onClose, invitesState }: UserSettingsProps) => {
  const { loading, refetchInvites } = invitesState

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-gray-700 p-3 shadow-lg flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span>User Options</span>
          <button
            onClick={() => onClose()}
            className="rounded-lg size-5 hover:bg-gray-500 text-center flex items-center justify-center transition cursor-pointer"
          >
            <X />
          </button>
        </div>

        <div className="border border-gray-400 rounded-md p-1 flex flex-col items-center">
          <div className="grid grid-cols-3  w-full">
            <span className="col-start-2 text-center">Pending Invites</span>
            <button onClick={() => refetchInvites()} className="cursor-pointer disabled:opacity-50" disabled={loading}>
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
