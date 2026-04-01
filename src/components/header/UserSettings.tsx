import { X, RefreshCw } from "lucide-react"
import { InvitesList } from "./InvitesList"
import { InviteWithListName } from "@/hooks/useUserInvites"
import { UsernameEditor } from "./UsernameEditor"
import { SignInMethodsPanel } from "./SignInMethodsPanel"
import { useMinDurationActive } from "@/hooks/useMinDurationActive"
import { UserProfile } from "@/hooks/useUserProfile"

interface UserSettingsProps {
  onLogout: () => Promise<void>
  onClose: () => void
  invitesState: {
    invites: InviteWithListName[]
    loading: boolean
    error: string | null
    refreshInvites: () => Promise<{ data: null; error: string | null }>
  }
  userProfile: UserProfile
}

const UserSettings = ({ onLogout, onClose, invitesState, userProfile }: UserSettingsProps) => {
  const { loading, refreshInvites } = invitesState

  const spinning = useMinDurationActive(loading, 300)

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
          <span>User Settings</span>
          <button
            onClick={() => onClose()}
            className="size-5 hover:bg-gray-500 text-center flex items-center justify-center transition cursor-pointer"
            title="Close settings"
          >
            <X />
          </button>
        </div>
        <UsernameEditor userProfile={userProfile} />

        <SignInMethodsPanel userEmail={userProfile.profile?.email?.trim() ?? ""} />

        <div className="border border-gray-400 rounded-md p-1 flex flex-col items-center">
          <div className="flex justify-center items-center  w-full">
            <span className="relative flex gap-1 items-center justify-center">
              {hasInvites && <span className="absolute top-2 -left-3 w-1.75 h-1.75 bg-red-500 rounded-full border border-white"></span>}
              <span className="text-sm text-center text-nowrap">Pending Invites</span>
              <button onClick={() => refreshInvites()} className="p-1 cursor-pointer disabled:opacity-50" disabled={spinning} title="Refresh invites">
                <RefreshCw size={16} className={spinning ? "animate-spin [animation-duration:600ms]" : ""} />
              </button>
            </span>
          </div>
          <InvitesList invitesState={invitesState} spinning={spinning} />
        </div>
        <div className="flex justify-center items-center">
          <button
            onClick={async () => {
              await onLogout()
              onClose()
            }}
            className="rounded-lg bg-red-500 px-4 py-2 w-max text-white hover:bg-red-600 transition cursor-pointer"
            title="Log out"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
