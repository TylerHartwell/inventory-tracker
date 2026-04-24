import { UserLists } from "@/features/lists/hooks/useUserLists"
import { Session } from "@supabase/supabase-js"
import { useRef, useState } from "react"
import { ListInput } from "./ListInput"
import { ChevronDown, ChevronUp, List, Settings } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { deleteList } from "@/features/lists/utils/list/deleteList"
import { nullListName } from "@/features/items/components/ItemManager"
import ListConfigModal from "./ListConfigModal"
import { useOutsidePointerDownClose } from "@/shared/hooks/useOutsidePointerDownClose"
import { deleteListUser } from "@/features/invites/utils/list-user/deleteListUser"

interface ListSelectorProps {
  selectedListId: string | null
  onItemInputListChange: (listId: string | null) => void
  session: Session
  userLists: UserLists
  refreshItems: () => Promise<void>
}

export function ListSelector({ selectedListId, onItemInputListChange, session, userLists, refreshItems }: ListSelectorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [configId, setConfigId] = useState<string | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const { open, setOpen, ref: contentRef } = useOutsidePointerDownClose<HTMLDivElement>({ closeOnScroll: true })
  const inputRef = useRef<HTMLInputElement>(null)
  const { lists, loading, error, refreshLists } = userLists

  const handleItemInputListChange = (selectedValue: string | null) => {
    setIsCreating(false)
    onItemInputListChange(selectedValue)
  }

  const handleListCreated = async (newListId: string) => {
    await refreshLists()
    handleItemInputListChange(newListId)
  }

  const handleDelete = async (listId: string) => {
    if (!confirm("Delete this list and all its items?")) return
    const { error } = await deleteList({ listId })
    if (error) {
      console.error(error)
      return
    }
    handleItemInputListChange(null)
    setConfigId(null)
    setIsConfigOpen(false)
    refreshLists()
  }

  const handleLeave = async (listId: string) => {
    if (!confirm("Leave this list?")) return

    const { error } = await deleteListUser({
      listId,
      userId: session.user.id
    })

    if (error) {
      console.error(error)
      return
    }

    handleItemInputListChange(null)
    setConfigId(null)
    setIsConfigOpen(false)
    refreshLists()
  }

  const getTriggerLabel = () => {
    if (!selectedListId) return nullListName
    return lists.find(list => list.id === selectedListId)?.name ?? "Unavailable list"
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-medium whitespace-nowrap flex items-center">
          List
          <List size={16} className="ml-1" />
        </span>
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
              avoidCollisions
              collisionPadding={8}
              align="start"
              sideOffset={4}
              side="bottom"
              className="z-50 bg-black text-white rounded shadow-lg border border-white w-(--radix-dropdown-menu-trigger-width) max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto"
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
                    inputRef.current?.focus()
                  }}
                  className="flex justify-between items-baseline font-bold px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer"
                >
                  + Create New List
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Separator className="h-px bg-gray-700" />

              <DropdownMenu.Item
                onSelect={() => handleItemInputListChange(null)}
                className={`flex justify-between items-baseline px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer ${selectedListId === null ? "bg-white/15" : ""}`}
              >
                <span>{nullListName}</span>
              </DropdownMenu.Item>

              {lists.map(list => (
                <DropdownMenu.Item
                  key={list.id}
                  onSelect={() => handleItemInputListChange(list.id)}
                  className={`flex justify-between items-center px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer ${list.id === selectedListId ? "bg-white/15" : ""}`}
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
                    title="Configure list"
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
          onListDelete={handleDelete}
          onListLeave={handleLeave}
          nullListName={nullListName}
          refreshItems={refreshItems}
          refreshLists={refreshLists}
        />
      )}
    </div>
  )
}
