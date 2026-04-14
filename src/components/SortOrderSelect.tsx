import { useOutsidePointerDownClose } from "@/hooks/useOutsidePointerDownClose"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronDown, ChevronUp } from "lucide-react"

export type SortField = "createdAt" | "lastUpdatedAt" | "expirationDate" | "itemName"

interface SortOrderSelectProps {
  sortField: SortField
  sortAsc: boolean
  onChange: (field: SortField, asc: boolean) => void
}

const SORT_OPTIONS: { field: SortField; asc: boolean; label: string }[] = [
  { field: "createdAt", asc: false, label: "Date Added: Newest First" },
  { field: "createdAt", asc: true, label: "Date Added: Oldest First" },
  { field: "lastUpdatedAt", asc: false, label: "Last Updated: Newest First" },
  { field: "lastUpdatedAt", asc: true, label: "Last Updated: Oldest First" },
  { field: "expirationDate", asc: true, label: "Expiration: Soonest First" },
  { field: "expirationDate", asc: false, label: "Expiration: Furthest First" },
  { field: "itemName", asc: true, label: "Name: A → Z" },
  { field: "itemName", asc: false, label: "Name: Z → A" }
]

export const SortOrderSelect = ({ sortField, sortAsc, onChange }: SortOrderSelectProps) => {
  const { open, setOpen, ref } = useOutsidePointerDownClose<HTMLDivElement>({ closeOnScroll: true })

  const currentLabel = SORT_OPTIONS.find(o => o.field === sortField && o.asc === sortAsc)?.label ?? ""

  return (
    <DropdownMenu.Root open={open} modal={false} onOpenChange={setOpen}>
      <div className="flex items-center gap-1 flex-1">
        <span className="text-sm whitespace-nowrap">Sort:</span>
        <DropdownMenu.Trigger className="border px-2 py-1 w-full h-full rounded flex justify-between items-center text-sm text-nowrap cursor-pointer">
          {currentLabel}
          {open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </DropdownMenu.Trigger>
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          ref={ref}
          avoidCollisions
          collisionPadding={8}
          align="start"
          sideOffset={4}
          side="bottom"
          className="bg-black text-white rounded shadow-lg border border-white w-(--radix-dropdown-menu-trigger-width) max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto"
        >
          {SORT_OPTIONS.map(option => {
            const isSelected = option.field === sortField && option.asc === sortAsc
            return (
              <DropdownMenu.Item
                key={option.label}
                onSelect={() => onChange(option.field, option.asc)}
                className={`flex justify-between items-baseline px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer ${isSelected ? "bg-white/15" : ""}`}
              >
                {option.label}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
