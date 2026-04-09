import { useState, useRef, useEffect } from "react"

interface UseOutsidePointerDownCloseOptions {
  closeOnScroll?: boolean
}

export function useOutsidePointerDownClose<T extends HTMLElement>(options: UseOutsidePointerDownCloseOptions = {}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<T | null>(null)
  const { closeOnScroll = false } = options

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

  useEffect(() => {
    if (!open || !closeOnScroll) return

    const handleWindowScroll = () => setOpen(false)

    window.addEventListener("scroll", handleWindowScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleWindowScroll)
  }, [closeOnScroll, open])

  return { open, setOpen, ref }
}
