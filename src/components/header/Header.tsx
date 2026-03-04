import { useState } from "react"
import { Settings } from "lucide-react"
import UserSettings from "./UserSettings"
import { useUserInvites } from "@/hooks/useUserInvites"
import { useUserProfile } from "@/hooks/useUserProfile"

interface HeaderProps {
  userEmail: string
  onLogout: () => Promise<void>
}

export const Header = ({ userEmail, onLogout }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const invitesState = useUserInvites()
  const userProfile = useUserProfile()

  const showUser = !userProfile.loading
  const hasInvites = invitesState.invites.length > 0
  const hasPersistedUsername = Boolean(userProfile?.profile?.username?.trim())

  return (
    <>
      {/* Header */}
      <div className="flex justify-end items-baseline text-sm">
        <h2 className="hidden 2xs:block font-semibold grow">Inventory Tracker</h2>
        <div className="flex items-center">
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
              showUser ? "opacity-100 mr-2" : "max-w-0 opacity-0"
            }`}
          >
            <span className={`inline-block transition-transform duration-300 ease-out ${showUser ? "translate-x-0" : "translate-x-full"}`}>
              {showUser ? (userProfile.profile?.username ?? userEmail) : null}
            </span>
          </div>
          <button
            onClick={() => {
              setIsOpen(true)
            }}
            className="relative rounded-lg px-2 py-1 font-medium bg-black hover:bg-gray-600 transition cursor-pointer"
          >
            <Settings size={16} />
            {(hasInvites || (!hasPersistedUsername && !userProfile.loading)) && (
              <span className="absolute top-px left-1 w-1.75 h-1.75 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>
        </div>
      </div>

      {/* Modal Backdrop */}
      {isOpen && <UserSettings onLogout={onLogout} onClose={() => setIsOpen(false)} invitesState={invitesState} userProfile={userProfile} />}
    </>
  )
}
