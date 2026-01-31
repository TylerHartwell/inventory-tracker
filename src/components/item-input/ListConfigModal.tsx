import { ChangeEvent, useState } from "react"
import { Session } from "@supabase/supabase-js"
import { updateList } from "@/utils/list/updateList"
import { List } from "../ItemManager"
import { MembersList } from "./MembersList"
import { insertListInvite } from "@/utils/list-invite/insertListInvite"

function ListConfigModal({
  onClose,
  configId,
  lists,
  session,
  handleDelete,
  nullListName,
  refresh,
  fetchLists
}: {
  onClose: () => void
  configId: string
  lists: List[]
  session: Session
  handleDelete: (id: string) => void
  nullListName: string
  refresh: () => Promise<void>
  fetchLists: () => Promise<void>
}) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isManagingUsers, setIsManagingUsers] = useState(false)
  const [newName, setNewName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [membersKey, setMembersKey] = useState(0)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const currentList = lists.find(l => l.id === configId)

  const handleUpdateName = async () => {
    if (!currentList || !newName.trim()) return
    const { error } = await updateList({
      list: currentList,
      updates: { name: newName.trim() }
    })
    if (error) {
      console.error(error)
      return
    }

    setIsEditingName(false)
    refresh()
    fetchLists()
  }

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUserEmail(e.target.value)
    if (e.target.value.toLowerCase() === session.user.email?.toLowerCase()) {
      setInviteError("You can't invite yourself")
      return
    }
    setInviteError(null)
  }

  const handleInvite = async (newRole: "editor" | "viewer") => {
    if (!newUserEmail || !currentList) return

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
    <div
      className="fixed inset-0 flex flex-col items-center bg-black/70 z-50"
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-gray-900 text-white rounded-lg p-4 w-80 mt-20" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-3">Configure List</h2>
        <p className="text-sm text-gray-400 mb-4">
          Managing: <strong>{currentList ? currentList.name : nullListName}</strong>
        </p>

        <div className="space-y-2">
          {!isEditingName ? (
            <button
              type="button"
              onClick={() => {
                setNewName(currentList?.name ?? "")
                setIsEditingName(true)
              }}
              className="w-full text-left bg-gray-800 px-2 py-1 rounded hover-fine:outline-1 active:outline-1"
            >
              ✏️ Edit Name
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                name="list-name"
                placeholder="List Name"
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleUpdateName()
                  }
                }}
                className="flex-1 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring"
                autoFocus
              />
              <button onClick={handleUpdateName} className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-800">
                Save
              </button>
            </div>
          )}

          {configId !== null && (
            <>
              {!isManagingUsers ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsManagingUsers(true)
                  }}
                  className="w-full text-left bg-gray-800 px-2 py-1 rounded hover-fine:outline-1 active:outline-1"
                >
                  👥 Manage Users
                </button>
              ) : (
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
                    >
                      Invite
                    </button>
                  </form>
                  {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}

                  {/* Members list */}
                  <MembersList key={membersKey} listId={configId} session={session} />
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDelete(configId)}
                className="w-full text-left bg-red-700 px-2 py-1 rounded hover-fine:outline-1 active:outline-1"
              >
                🗑️ Delete List
              </button>
            </>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button type="button" className="text-sm text-gray-400 hover-fine:outline-1 active:outline-1" onClick={() => onClose()}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ListConfigModal
