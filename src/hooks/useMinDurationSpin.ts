import { useEffect, useRef, useState } from "react"

export function useMinDurationSpin(loading: boolean, minDurationMs = 300, onFinish?: () => void) {
  const [spinning, setSpinning] = useState(false)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (loading) {
      startTimeRef.current = Date.now()
      setSpinning(true)
    } else if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(minDurationMs - elapsed, 0)

      timeout = setTimeout(() => {
        setSpinning(false)
        onFinish?.()
        startTimeRef.current = null
      }, remaining)
    }

    return () => clearTimeout(timeout)
  }, [loading, minDurationMs, onFinish])

  return spinning
}
