import { UserLists } from "@/hooks/useUserLists"
import { Session } from "@supabase/supabase-js"
import { ComponentRef, useEffect, useRef, useState } from "react"
import { ListInput } from "./ListInput"
import { ChevronDown, ChevronUp, Settings } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { deleteList } from "@/utils/deleteList"
import { nullListName } from "./ItemManager"

interface ListSelectorProps {
  selectedList: string | null
  onItemInputListChange: (listId: string | null) => void

  session: Session
  userLists: UserLists
}

export function ListSelector({ selectedList, onItemInputListChange, session, userLists }: ListSelectorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [openConfigFor, setOpenConfigFor] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const contentRef = useRef<ComponentRef<typeof DropdownMenu.Content>>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCreating) {
      inputRef.current?.focus()
    }
  }, [isCreating])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (contentRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  const { lists, loading, error, fetchLists } = userLists

  const handleValueChange = (selectedValue: string | null) => {
    setIsCreating(false)
    onItemInputListChange(selectedValue)
  }

  const handleListCreated = async (newListId: string) => {
    handleValueChange(newListId)
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
              {open ? <ChevronUp className="mx-1 text-gray-500" /> : <ChevronDown className="mx-1 text-gray-500" />}
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
              ref={contentRef}
              align="start"
              className="bg-black text-white rounded shadow-lg border border-white w-[var(--radix-dropdown-menu-trigger-width)]"
            >
              {isCreating ? (
                <DropdownMenu.Item asChild>
                  <ListInput
                    session={session}
                    onListCreated={handleListCreated}
                    onCancel={() => {
                      setIsCreating(false)
                      setOpen(false)
                    }}
                  />
                </DropdownMenu.Item>
              ) : (
                <DropdownMenu.Item
                  onSelect={e => {
                    e.preventDefault()
                    setIsCreating(true)
                  }}
                  className="flex justify-between items-baseline font-bold px-2 py-1 hover-fine:outline-1 active:outline-1"
                >
                  + Create New List
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Separator className="h-px bg-gray-700" />

              <DropdownMenu.Item
                onSelect={() => handleValueChange(null)}
                className="flex justify-between items-baseline px-2 py-1 hover-fine:outline-1 active:outline-1"
              >
                <span>{nullListName}</span>
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpen(false)
                    handleValueChange(null)
                    setOpenConfigFor(null)
                  }}
                  className="py-1 hover-fine:outline-1 active:outline-1 px-2 flex justify-end"
                >
                  <Settings size={14} />
                </button>
              </DropdownMenu.Item>

              {lists.map(list => (
                <DropdownMenu.Item
                  key={list.id}
                  onSelect={() => handleValueChange(list.id)}
                  className="flex justify-between items-center px-2 py-1 hover-fine:outline-1 active:outline-1"
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
                    className="py-1 hover-fine:outline-1 active:outline-1 px-2 flex justify-end"
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
              Managing: <strong>{openConfigFor ? lists.find(l => l.id === openConfigFor)?.name : nullListName}</strong>
            </p>

            <div className="space-y-2">
              <button type="button" className="w-full text-left bg-gray-800 px-2 py-1 rounded hover-fine:outline-1 active:outline-1">
                ✏️ Edit Name
              </button>
              <button type="button" className="w-full text-left bg-gray-800 px-2 py-1 rounded hover-fine:outline-1 active:outline-1">
                👥 Manage Users
              </button>
              {openConfigFor !== "personal" && (
                <button
                  type="button"
                  onClick={() => handleDelete(openConfigFor)}
                  className="w-full text-left bg-red-700 px-2 py-1 rounded hover-fine:outline-1 active:outline-1"
                >
                  🗑️ Delete List
                </button>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button type="button" className="text-sm text-gray-400 hover-fine:outline-1 active:outline-1" onClick={() => setOpenConfigFor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
