import { SessionKey } from "@/components/ItemManager"
import { useEffect, useRef, useState } from "react"

function useSessionStorage<T>(key: SessionKey, initial: T, userId?: string) {
  const [value, setValue] = useState<T>(() => {
    const saved = sessionStorage.getItem(key)
    return saved ? JSON.parse(saved) : initial
  })

  const prevUserRef = useRef(userId)

  useEffect(() => {
    if (prevUserRef.current && prevUserRef.current !== userId) {
      sessionStorage.removeItem(key)
      setValue(initial)
    }
    prevUserRef.current = userId
  }, [userId, key, initial])

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

export default useSessionStorage
