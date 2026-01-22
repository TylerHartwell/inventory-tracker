import { useState } from "react"
import { Settings } from "lucide-react"
import UserSettings from "./UserSettings"
import { useUserInvites } from "@/hooks/useUserInvites"
import { Session } from "@supabase/supabase-js"
import { useUserProfile } from "@/hooks/useUserProfile"

interface HeaderProps {
  session: Session
  onLogout: () => Promise<void>
}

export const Header = ({ session, onLogout }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const invitesState = useUserInvites()
  const userProfile = useUserProfile()
  const showUser = !userProfile.loading

  const hasInvites = invitesState.invites.length > 0

  return (
    <>
      {/* Header */}
      <div className="flex justify-end items-baseline text-sm">
        <h2 className="hidden 2xs:block font-semibold grow">Inventory Tracker</h2>
        <div className="flex items-center">
          <span className={`transition-all duration-300 ease-out ${showUser ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1/2"}`}>
            {showUser ? (userProfile.profile?.username ?? session.user.email) : null}
          </span>
          <button
            onClick={() => {
              setIsOpen(true)
            }}
            className="relative rounded-lg px-2 py-1 font-medium hover:bg-gray-600 transition cursor-pointer"
          >
            <Settings size={16} />
            {hasInvites && <span className="absolute top-0.25 left-1 w-1.75 h-1.75 bg-red-500 rounded-full border border-white"></span>}
          </button>
        </div>
      </div>

      {/* Modal Backdrop */}
      {isOpen && (
        <UserSettings session={session} onLogout={onLogout} onClose={() => setIsOpen(false)} invitesState={invitesState} userProfile={userProfile} />
      )}
    </>
  )
}
