import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useOutsidePointerDownClose } from "@/hooks/useOutsidePointerDownClose"

interface CategorySelectProps {
  value: string | null | undefined
  availableCategories: string[]
  onChange: (value: string | null) => void
}

export const CategorySelect = ({ value, availableCategories, onChange }: CategorySelectProps) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const [customCategory, setCustomCategory] = useState("")
  const customInputRef = useRef<HTMLInputElement>(null)
  const { open, setOpen, ref } = useOutsidePointerDownClose<HTMLDivElement>({ closeOnScroll: true })

  const dedupedCategories = useMemo(() => {
    return [...new Set(availableCategories.map(category => category.trim()).filter(Boolean))]
  }, [availableCategories])

  useEffect(() => {
    if (!isAddingCustom) {
      return
    }

    customInputRef.current?.focus()
  }, [isAddingCustom])

  const confirmCustomCategory = () => {
    const trimmedValue = customCategory.trim()

    if (!trimmedValue) {
      setIsAddingCustom(false)
      setCustomCategory("")
      return
    }

    onChange(trimmedValue)
    setIsAddingCustom(false)
    setCustomCategory("")
  }

  if (isAddingCustom) {
    return (
      <input
        ref={customInputRef}
        type="text"
        value={customCategory}
        onChange={e => setCustomCategory(e.target.value)}
        onBlur={confirmCustomCategory}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault()
            confirmCustomCategory()
          }

          if (e.key === "Escape") {
            e.preventDefault()
            setIsAddingCustom(false)
            setCustomCategory("")
          }
        }}
        placeholder="New category"
        className="w-full p-1 border border-gray-400 rounded"
      />
    )
  }

  return (
    <DropdownMenu.Root open={open} modal={false} onOpenChange={setOpen}>
      <DropdownMenu.Trigger
        type="button"
        className="w-full p-1 border border-gray-400 rounded flex items-center justify-between cursor-pointer"
        title="Select category"
      >
        <span className={value ? "text-white" : "text-gray-400"}>{value ?? "None"}</span>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          ref={ref}
          avoidCollisions
          collisionPadding={8}
          align="start"
          sideOffset={4}
          side="bottom"
          className="z-60 bg-black text-white rounded shadow-lg border border-white w-(--radix-dropdown-menu-trigger-width) max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto"
        >
          <DropdownMenu.Item
            onSelect={() => onChange(null)}
            className={`px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer ${value === null || value === undefined || value === "" ? "bg-white/15" : ""}`}
          >
            None
          </DropdownMenu.Item>

          {dedupedCategories.map(category => (
            <DropdownMenu.Item
              key={category}
              onSelect={() => onChange(category)}
              className={`px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer ${value === category ? "bg-white/15" : ""}`}
            >
              {category}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="h-px bg-white/20 my-1" />

          <DropdownMenu.Item
            onSelect={() => {
              setOpen(false)
              setIsAddingCustom(true)
            }}
            className="px-2 py-1 outline-white hover-fine:outline-1 active:outline-1 cursor-pointer"
          >
            Add new category...
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
