import { UserLists } from "@/hooks/useUserLists"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Switch from "@radix-ui/react-switch"
import { ChevronDown, ChevronUp } from "lucide-react"
import { nullListName } from "./ItemManager"
import { useOutsidePointerDownClose } from "@/hooks/useOutsidePointerDownClose"

interface ListFilterProps {
  filteredListIds: (string | null)[]
  onChange: (lists: (string | null)[]) => void
  selectedListId: string | null
  userLists: UserLists
  followInputList: boolean
  onToggleFollowInputList: () => void
}

export function ListFilter({ filteredListIds, onChange, selectedListId, userLists, followInputList, onToggleFollowInputList }: ListFilterProps) {
  const { open, setOpen, ref } = useOutsidePointerDownClose<HTMLDivElement>()

  const { lists, loading, error } = userLists

  const onlyNullListSelected = filteredListIds.length === 1 && filteredListIds.includes(null)

  const handleToggle = (id: string | null) => {
    const isSelected = filteredListIds.includes(id)

    const nextLists = isSelected ? filteredListIds.filter(v => v !== id) : [...filteredListIds, id]

    onChange(nextLists.length === 0 ? [null] : nextLists)
  }

  const handleFilterAll = () => {
    // e: MouseEvent<HTMLButtonElement>
    // e.currentTarget.blur()
    const allIds = [null, ...lists.map(l => l.id)]
    const allFiltered = allIds.every(id => filteredListIds.includes(id))

    onChange(allFiltered ? [null] : allIds)
  }

  const allIds = [null, ...lists.map(l => l.id)]
  const allFiltered = allIds.length > 0 && allIds.every(id => filteredListIds.includes(id))

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger className="border px-2 py-1 rounded w-full h-full flex justify-between items-center min-w-0 cursor-pointer">
        <span className="flex-1 text-left truncate">
          <span className="text-sm">Filter:</span>
          {filteredListIds.length > 0 && (
            <span className="ml-1 text-gray-500 text-sm">
              {filteredListIds
                .map(id => {
                  if (id === null) return nullListName
                  const list = lists.find(l => l.id === id)
                  return list ? list.name : ""
                })
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          ref={ref}
          avoidCollisions={false}
          align="start"
          sideOffset={0}
          side="bottom"
          className="bg-black text-white rounded shadow-lg border border-white w-(--radix-dropdown-menu-trigger-width)"
        >
          <DropdownMenu.Item asChild key={"default"} onSelect={e => e.preventDefault()}>
            <label className="flex items-center gap-2 px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer">
              <input
                type="checkbox"
                name="default"
                checked={filteredListIds.includes(null)}
                onChange={() => handleToggle(null)}
                className={`w-4 h-4 accent-blue-500 cursor-pointer ${onlyNullListSelected && "accent-gray-700"}`}
              />
              <span className={selectedListId === null ? "font-semibold underline" : ""}>{nullListName}</span>
            </label>
          </DropdownMenu.Item>

          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-400">Loading lists...</div>
          ) : error ? (
            <div className="px-4 py-2 text-sm text-red-500">{`Error getting lists: ${error}`}</div>
          ) : (
            lists.map(list => (
              <DropdownMenu.Item asChild key={list.id} onSelect={e => e.preventDefault()}>
                <label className="flex items-center gap-2 px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer">
                  <input
                    type="checkbox"
                    name={list.id}
                    checked={filteredListIds.includes(list.id)}
                    onChange={() => handleToggle(list.id)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                  <span className={list.id === selectedListId ? "font-semibold underline" : ""}>{list.name}</span>
                </label>
              </DropdownMenu.Item>
            ))
          )}

          <div className="flex justify-between  items-center p-1">
            <button
              type="button"
              onClick={handleFilterAll}
              className=" border border-gray-300 rounded px-3 py-1 text-sm cursor-pointer hover-fine:outline-1 active:outline-1 bg-black text-white"
              title={allFiltered ? `Only Show ${nullListName}` : "Include All"}
            >
              {allFiltered ? nullListName : "Include All"}
            </button>
            <label className="flex gap-1 flex-wrap items-center justify-center cursor-pointer">
              <Switch.Root
                id="follow-input-list"
                checked={followInputList}
                onClick={onToggleFollowInputList}
                className="group w-10 h-5 rounded-full border-2 border-gray-400 bg-gray-400 relative data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500  flex justify-between cursor-pointer"
                title={followInputList ? "Following input list - toggle to disable" : "Not following input list - toggle to enable"}
              >
                <Switch.Thumb
                  className="h-full aspect-square inline-block rounded-full bg-white transition-transform duration-300 ease-in-out
        translate-x-0 data-[state=checked]:translate-x-5 "
                />
                <span
                  className="text-[8px] grow flex items-center justify-center transition-transform duration-300 ease-in-out
        translate-x-0 group-data-[state=checked]:-translate-x-4 "
                >
                  {followInputList ? "ON" : "OFF"}
                </span>
              </Switch.Root>
              <span className="text-[12px] select-none text-center">Follow Input List</span>
            </label>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
