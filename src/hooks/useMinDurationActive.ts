import { useEffect, useEffectEvent, useRef, useState } from "react"

export function useMinDurationActive(active: boolean, minDurationMs = 300, onFinish?: () => void) {
  const [minDurationActive, setMinDurationActive] = useState(active)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeStartedAtRef = useRef<number | null>(null)
  const prevActiveRef = useRef(active)
  const minDurationMsRef = useRef(minDurationMs)

  useEffect(() => {
    minDurationMsRef.current = minDurationMs
  }, [minDurationMs])

  const setMinDurationActiveEvent = useEffectEvent((value: boolean) => {
    setMinDurationActive(prev => (prev === value ? prev : value))
  })

  const finishEvent = useEffectEvent(() => {
    onFinish?.()
  })

  useEffect(() => {
    const wasActive = prevActiveRef.current

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (active) {
      activeStartedAtRef.current = Date.now()
      setMinDurationActiveEvent(true)
    } else {
      if (wasActive) {
        const startedAt = activeStartedAtRef.current ?? Date.now()
        const elapsedMs = Date.now() - startedAt
        const remainingMs = Math.max(0, minDurationMsRef.current - elapsedMs)

        if (remainingMs > 0) {
          timeoutRef.current = setTimeout(() => {
            setMinDurationActiveEvent(false)
            timeoutRef.current = null
            finishEvent()
          }, remainingMs)
        } else {
          setMinDurationActiveEvent(false)
          finishEvent()
        }
      } else {
        setMinDurationActiveEvent(false)
      }

      activeStartedAtRef.current = null
    }

    prevActiveRef.current = active

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [active])

  return minDurationActive
}
