import { useState } from "react"
import { X, Eye, EyeOff } from "lucide-react"
import { InvitesList } from "./InvitesList"

interface HeaderProps {
  userEmail: string
  onLogout: () => Promise<void>
}

export const Header = ({ userEmail, onLogout }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [ignoredVisible, setIgnoredVisible] = useState(false)

  return (
    <>
      {/* Header */}
      <div className="flex justify-end items-baseline text-sm">
        <h2 className="hidden 2xs:block font-semibold grow">Inventory Tracker</h2>

        <button onClick={() => setIsOpen(true)} className="rounded-lg px-2 py-1 font-medium hover:bg-gray-600 transition">
          {userEmail}
        </button>
      </div>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          {/* Modal */}
          <div className="w-full max-w-sm rounded-xl bg-gray-700 p-3 shadow-lg flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span>User Options</span>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg size-5 hover:bg-gray-500 text-center flex items-center justify-center transition cursor-pointer"
              >
                <X />
              </button>
            </div>

            <div className="border border-gray-400 rounded-md p-1 flex flex-col items-center">
              <div className="grid grid-cols-3  w-full">
                <span className="col-start-2 text-center">Pending Invites</span>
                <button className="flex gap-1 justify-self-end cursor-pointer" onClick={() => setIgnoredVisible(prev => !prev)}>
                  Ignored:
                  {ignoredVisible ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <InvitesList />
            </div>

            <div className="flex justify-center items-center">
              <button
                onClick={async () => {
                  await onLogout()
                  setIsOpen(false)
                }}
                className="rounded-lg bg-red-500 px-4 py-2 w-max text-white hover:bg-red-600 transition cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
