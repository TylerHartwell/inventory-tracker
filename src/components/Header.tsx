import { useState } from "react"
import { Settings } from "lucide-react"
import UserSettings from "./UserSettings"
import { useUserInvites } from "@/hooks/useUserInvites"
import { Session } from "@supabase/supabase-js"

interface HeaderProps {
  session: Session
  onLogout: () => Promise<void>
}

export const Header = ({ session, onLogout }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const invitesState = useUserInvites()

  const hasInvites = invitesState.invites.length > 0

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-baseline text-sm">
        <h2 className="hidden 2xs:block font-semibold grow">Inventory Tracker</h2>
        <div className="flex items-center">
          <span> {session.user.email}</span>
          <button
            onClick={e => {
              console.log(e)
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
      {isOpen && <UserSettings session={session} onLogout={onLogout} onClose={() => setIsOpen(false)} invitesState={invitesState} />}
    </>
  )
}
