import { useState } from "react"
import { Session } from "@supabase/supabase-js"
import { updateList } from "@/utils/updateList"
import { List } from "./ItemManager"

function ListConfigModal({
  setIsConfigOpen,
  configId,
  lists,
  session,
  handleDelete,
  nullListName,
  refresh,
  fetchLists
}: {
  setIsConfigOpen: (v: boolean) => void
  configId: string
  lists: List[]
  session: Session
  handleDelete: (id: string) => void
  nullListName: string
  refresh: () => Promise<void>
  fetchLists: () => Promise<void>
}) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const currentList = lists.find(l => l.id === configId)

  const handleUpdateName = async () => {
    if (!currentList || !newName.trim()) return
    const { error } = await updateList({
      list: currentList,
      session,
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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          setIsConfigOpen(false)
        }
      }}
    >
      <div className="bg-gray-900 text-white rounded-lg p-4 w-80" onClick={e => e.stopPropagation()}>
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
              <button onClick={handleUpdateName} className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-500">
                Save
              </button>
            </div>
          )}

          {configId !== null && (
            <>
              <button type="button" className="w-full text-left bg-gray-800 px-2 py-1 rounded hover-fine:outline-1 active:outline-1">
                👥 Manage Users
              </button>
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
          <button type="button" className="text-sm text-gray-400 hover-fine:outline-1 active:outline-1" onClick={() => setIsConfigOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ListConfigModal
