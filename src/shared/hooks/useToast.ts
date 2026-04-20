import { useState, useEffect, useCallback } from "react"

export type UseToastReturn<T> = {
  toast: T | null
  setToast: (toast: T | null) => void
  isVisible: boolean
  isFadingIn: boolean
  isFadingOut: boolean
  fadeInDuration: number
  fadeOutDuration: number
}

export const useToast = <T = unknown>({
  initialState = null,
  visibleDuration = 1000,
  fadeInDuration = 0,
  fadeOutDuration = 500,
  shouldFadeIn = () => true,
  shouldFadeOut = () => true
}: {
  initialState?: T | null
  visibleDuration?: number
  fadeInDuration?: number
  fadeOutDuration?: number
  shouldFadeIn?: (state: T) => boolean
  shouldFadeOut?: (state: T) => boolean
} = {}): UseToastReturn<T> => {
  const [toast, setToastRaw] = useState<T | null>(initialState ?? null)
  const [isFadingIn, setIsFadingIn] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  // Wrap setToast to reset fading states when toast changes,
  // avoiding synchronous setState calls inside effects.
  const setToast = useCallback(
    (t: T | null) => {
      setToastRaw(t)
      setIsFadingIn(t !== null && fadeInDuration > 0 && shouldFadeIn(t))
      setIsFadingOut(false)
    },
    [fadeInDuration, shouldFadeIn]
  )

  // Handle fade-in completion
  useEffect(() => {
    if (!isFadingIn) return

    const timeout = setTimeout(() => {
      setIsFadingIn(false)
    }, fadeInDuration)

    return () => clearTimeout(timeout)
  }, [isFadingIn, fadeInDuration])

  // Handle fade-out trigger (after visible duration, only if not fading in and should fade out)
  useEffect(() => {
    if (!toast || isFadingIn || !shouldFadeOut(toast)) return

    const timeout = setTimeout(() => {
      setIsFadingOut(true)
    }, visibleDuration)

    return () => clearTimeout(timeout)
  }, [toast, isFadingIn, visibleDuration, shouldFadeOut])

  // Handle fade-out completion and toast clearing
  useEffect(() => {
    if (!isFadingOut) return

    const fadeTimeout = setTimeout(() => {
      setToast(null)
    }, fadeOutDuration)

    return () => clearTimeout(fadeTimeout)
  }, [isFadingOut, fadeOutDuration, setToast])

  return { toast, setToast, isVisible: toast !== null, isFadingIn, isFadingOut, fadeInDuration, fadeOutDuration }
}
