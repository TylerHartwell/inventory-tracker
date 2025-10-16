import { useUserLists } from "@/hooks/useUserLists"
import { Session } from "@supabase/supabase-js"
import { useState } from "react"
import { ListInput } from "./ListInput"
import { ChevronDown, Settings } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { deleteList } from "@/utils/deleteList"

interface ListSelectorProps {
  value: string | null
  onChange: (listId: string | null) => void
  session: Session
}

export function ListSelector({ value, onChange, session }: ListSelectorProps) {
  const { lists, loading, error } = useUserLists(session.user.id)
  const [creatingNew, setCreatingNew] = useState(false)
  const [openConfigFor, setOpenConfigFor] = useState<string | null>(null)
  const nullListName = "Personal"
  const [newListName, setNewListName] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "new") {
      setCreatingNew(true)
    } else {
      setCreatingNew(false)
      onChange(selectedValue === nullListName ? null : selectedValue)
    }
  }

  const handleListCreated = async (newListId: string, name: string) => {
    onChange(newListId)
    setNewListName(name)
    setCreatingNew(false)
  }

  const handleDelete = async (listId: string) => {
    try {
      await deleteList({ listId, session })
      alert("List deleted successfully!")
      // Optionally: refresh data or navigate away
    } catch (error: unknown) {
      console.error(error)
      alert(`Failed to delete list: ${(error as Error)?.message}`)
    }
  }

  const getTriggerLabel = () => {
    if (newListName) return newListName
    if (!value) return nullListName
    return lists.find(list => list.id === value)?.name ?? value
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-medium whitespace-nowrap">List:</span>
        {loading ? (
          <div className="text-gray-500">Loading lists...</div>
        ) : error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : (
          <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenu.Trigger className="border px-2 py-1 rounded w-full flex justify-between items-center">
              {getTriggerLabel()}
              <ChevronDown className="mx-1" />
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
              align="start"
              className="bg-black text-white rounded shadow-lg border border-white w-[var(--radix-dropdown-menu-trigger-width)]"
            >
              <DropdownMenu.Item
                onSelect={() => handleValueChange("new")}
                className="flex justify-between items-center font-bold px-2 py-1 hover:bg-gray-800"
              >
                + Create New List
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onSelect={() => handleValueChange(nullListName)}
                className="flex justify-between items-center px-2 py-1 hover:bg-gray-800"
              >
                <span>{nullListName} (Default)</span>
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpen(false)
                    handleValueChange(nullListName)
                    setOpenConfigFor(null)
                  }}
                  className="py-1 hover:text-blue-400 px-2 flex justify-end"
                >
                  <Settings size={14} />
                </button>
              </DropdownMenu.Item>

              {lists.map(list => (
                <DropdownMenu.Item
                  key={list.id}
                  onSelect={() => handleValueChange(list.id)}
                  className="flex justify-between items-center px-2 py-1 hover:bg-gray-800"
                >
                  <span>{list.name}</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation() // Prevent the menu item select
                      setOpen(false)
                      handleValueChange(list.id)
                      setOpenConfigFor(list.id)
                    }}
                    className="py-1 hover:text-blue-400 px-2 flex justify-end"
                  >
                    <Settings size={14} />
                  </button>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        )}
      </div>

      {creatingNew && <ListInput session={session} onListCreated={handleListCreated} />}

      {openConfigFor && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
          onClick={() => setOpenConfigFor(null)} // click outside closes modal
        >
          <div
            className="bg-gray-900 text-white rounded-lg p-4 w-80"
            onClick={e => e.stopPropagation()} // prevent modal click from closing
          >
            <h2 className="text-lg font-semibold mb-3">Configure List</h2>
            <p className="text-sm text-gray-400 mb-4">
              Managing: <strong>{openConfigFor ? lists.find(l => l.id === openConfigFor)?.name : "Personal (Default)"}</strong>
            </p>

            <div className="space-y-2">
              <button type="button" className="w-full text-left bg-gray-800 px-2 py-1 rounded hover:bg-gray-700">
                ✏️ Edit Name
              </button>
              <button type="button" className="w-full text-left bg-gray-800 px-2 py-1 rounded hover:bg-gray-700">
                👥 Manage Users
              </button>
              {openConfigFor !== "personal" && (
                <button
                  type="button"
                  onClick={() => handleDelete(openConfigFor)}
                  className="w-full text-left bg-red-700 px-2 py-1 rounded hover:bg-red-600"
                >
                  🗑️ Delete List
                </button>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button type="button" className="text-sm text-gray-400 hover:text-white" onClick={() => setOpenConfigFor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
