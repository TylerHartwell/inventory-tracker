import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronDown } from "lucide-react"
import { ComponentRef, useEffect, useRef, useState } from "react"

interface SortOrderSelectProps {
  sortAsc: boolean
  onChange: (asc: boolean) => void
}

export const SortOrderSelect = ({ sortAsc, onChange }: SortOrderSelectProps) => {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<ComponentRef<typeof DropdownMenu.Content>>(null)

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

  return (
    <DropdownMenu.Root open={open} modal={false} onOpenChange={setOpen}>
      <DropdownMenu.Trigger className="border px-2 py-1  w-full h-full rounded flex justify-between items-center text-sm text-nowrap cursor-pointer">
        {sortAsc ? "Oldest First" : "Newest First"}
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          ref={contentRef}
          align="start"
          className="bg-black text-white rounded shadow-lg border border-white w-[var(--radix-dropdown-menu-trigger-width)]"
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
