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

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-baseline text-sm">
        <h2 className="hidden 2xs:block font-semibold grow">Inventory Tracker</h2>
        <div className="flex items-center">
          <span> {session.user.email}</span>
          <button onClick={() => setIsOpen(true)} className="rounded-lg px-2 py-1 font-medium hover:bg-gray-600 transition cursor-pointer">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Modal Backdrop */}
      {isOpen && <UserSettings session={session} onLogout={onLogout} onClose={() => setIsOpen(false)} invitesState={invitesState} />}
    </>
  )
}
