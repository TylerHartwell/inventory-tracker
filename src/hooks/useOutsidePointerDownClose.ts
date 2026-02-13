import { useState, useRef, useEffect } from "react"

export function useOutsidePointerDownClose<T extends HTMLElement>() {
  const [open, setOpen] = useState(false)
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  return { open, setOpen, ref }
}
