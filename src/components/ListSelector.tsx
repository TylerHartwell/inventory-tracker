import { UserLists } from "@/hooks/useUserLists"
import { Session } from "@supabase/supabase-js"
import { useEffect, useRef, useState } from "react"
import { ListInput } from "./ListInput"
import { ChevronDown, Settings } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { deleteList } from "@/utils/deleteList"

interface ListSelectorProps {
  selectedList: string | null
  onListChange: (listId: string | null) => void
  onListCreated: (newListId: string) => void
  session: Session
  userLists: UserLists
}

export function ListSelector({ selectedList, onListChange, onListCreated, session, userLists }: ListSelectorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [openConfigFor, setOpenConfigFor] = useState<string | null>(null)
  const nullListName = "Personal"
  const [open, setOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCreating) {
      inputRef.current?.focus()
    }
  }, [isCreating])

  const { lists, loading, error, fetchLists } = userLists

  const handleValueChange = (selectedValue: string | null) => {
    setIsCreating(false)
    onListChange(selectedValue)
  }

  const handleListCreated = async (newListId: string) => {
    onListChange(newListId)
    setIsCreating(false)
    onListCreated(newListId)
    fetchLists()
  }

  const handleDelete = async (listId: string) => {
    const { error } = await deleteList({ listId, session })
    if (error) {
      console.error(error)
      return
    }
    alert("List deleted successfully!")
    handleValueChange(null)
    setOpenConfigFor(null)
    fetchLists()
  }

  const getTriggerLabel = () => {
    if (!selectedList) return nullListName
    return lists.find(list => list.id === selectedList)?.name ?? selectedList
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
          <DropdownMenu.Root
            open={open}
            onOpenChange={nextOpen => {
              setOpen(nextOpen)
              if (!nextOpen) {
                setIsCreating(false)
              }
            }}
            modal={false}
          >
            <DropdownMenu.Trigger className="border px-2 py-1 rounded w-full flex justify-between items-center">
              {getTriggerLabel()}
              <ChevronDown className="mx-1" />
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
              align="start"
              className="bg-black text-white rounded shadow-lg border border-white w-[var(--radix-dropdown-menu-trigger-width)]"
            >
              {isCreating ? (
                <DropdownMenu.Item asChild>
                  <ListInput session={session} onListCreated={handleListCreated} onCancel={() => setIsCreating(false)} />
                </DropdownMenu.Item>
              ) : (
                <DropdownMenu.Item
                  onSelect={e => {
                    e.preventDefault()
                    setIsCreating(true)
                  }}
                  className="flex justify-between items-baseline font-bold px-2 py-1 hover:bg-gray-800"
                >
                  + Create New List
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Separator className="h-px bg-gray-700" />

              <DropdownMenu.Item onSelect={() => handleValueChange(null)} className="flex justify-between items-baseline px-2 py-1 hover:bg-gray-800">
                <span>{nullListName} (Default)</span>
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpen(false)
                    handleValueChange(null)
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
