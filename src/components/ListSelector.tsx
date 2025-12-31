import { UserLists } from "@/hooks/useUserLists"
import { Session } from "@supabase/supabase-js"
import { ComponentRef, useEffect, useRef, useState } from "react"
import { ListInput } from "./ListInput"
import { ChevronDown, ChevronUp, Settings } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { deleteList } from "@/utils/deleteList"
import { nullListName } from "./ItemManager"
import ListConfigModal from "./ListConfigModal"

interface ListSelectorProps {
  selectedList: string | null
  onItemInputListChange: (listId: string | null) => void
  session: Session
  userLists: UserLists
  refresh: () => Promise<void>
}

export function ListSelector({ selectedList, onItemInputListChange, session, userLists, refresh }: ListSelectorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [configId, setConfigId] = useState<string | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
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

  const handleItemInputListChange = (selectedValue: string | null) => {
    setIsCreating(false)
    onItemInputListChange(selectedValue)
  }

  const handleListCreated = async (newListId: string) => {
    handleItemInputListChange(newListId)
    fetchLists()
  }

  const handleDelete = async (listId: string) => {
    if (!confirm("Delete this list and all its items?")) return
    const { error } = await deleteList({ listId, session })
    if (error) {
      console.error(error)
      return
    }
    handleItemInputListChange(null)
    setConfigId(null)
    setIsConfigOpen(false)
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
            <DropdownMenu.Trigger className="border px-2 py-1 rounded w-full flex justify-between items-center cursor-pointer">
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
                  className="flex justify-between items-baseline font-bold px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer"
                >
                  + Create New List
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Separator className="h-px bg-gray-700" />

              <DropdownMenu.Item
                onSelect={() => handleItemInputListChange(null)}
                className="flex justify-between items-baseline px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer"
              >
                <span>{nullListName}</span>
              </DropdownMenu.Item>

              {lists.map(list => (
                <DropdownMenu.Item
                  key={list.id}
                  onSelect={() => handleItemInputListChange(list.id)}
                  className="flex justify-between items-center px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer"
                >
                  <span>{list.name}</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpen(false)
                      handleItemInputListChange(list.id)
                      setConfigId(list.id)
                      setIsConfigOpen(true)
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

      {isConfigOpen && configId !== null && (
        <ListConfigModal
          onClose={() => setIsConfigOpen(false)}
          configId={configId}
          lists={lists}
          session={session}
          handleDelete={handleDelete}
          nullListName={nullListName}
          refresh={refresh}
          fetchLists={fetchLists}
        />
      )}
    </div>
  )
}
