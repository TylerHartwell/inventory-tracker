import { useEffect, useRef, useState } from "react"

export function useMinDurationActive(active: boolean, minDurationMs = 300, onFinish?: () => void) {
  const [isActive, setIsActive] = useState(false)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (active) {
      startTimeRef.current = Date.now()
      setIsActive(true)
    } else if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(minDurationMs - elapsed, 0)

      timeout = setTimeout(() => {
        setIsActive(false)
        onFinish?.()
        startTimeRef.current = null
      }, remaining)
    }

    return () => clearTimeout(timeout)
  }, [active, minDurationMs, onFinish])

  return isActive
}
