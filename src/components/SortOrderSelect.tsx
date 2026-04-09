import { useOutsidePointerDownClose } from "@/hooks/useOutsidePointerDownClose"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronDown, ChevronUp } from "lucide-react"

interface SortOrderSelectProps {
  sortAsc: boolean
  onChange: (asc: boolean) => void
}

export const SortOrderSelect = ({ sortAsc, onChange }: SortOrderSelectProps) => {
  const { open, setOpen, ref } = useOutsidePointerDownClose<HTMLDivElement>({ closeOnScroll: true })

  return (
    <DropdownMenu.Root open={open} modal={false} onOpenChange={setOpen}>
      <DropdownMenu.Trigger className="border px-2 py-1  w-full h-full rounded flex justify-between items-center text-sm text-nowrap cursor-pointer">
        {sortAsc ? "Oldest First" : "Newest First"}
        {open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </DropdownMenu.Trigger>

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
          <DropdownMenu.Item
            onSelect={() => onChange(false)}
            className="flex justify-between items-baseline px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer"
          >
            Newest First
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => onChange(true)}
            className="flex justify-between items-baseline px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer"
          >
            Oldest First
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
