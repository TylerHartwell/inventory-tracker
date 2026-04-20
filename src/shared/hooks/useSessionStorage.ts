import { SessionKey } from "@/shared/types/session"
import { useState } from "react"

function useSessionStorage<T>(key: SessionKey, initial: T, userId: string) {
  const [value, setValue] = useState<T>(() => {
    const saved = sessionStorage.getItem(key)
    return saved ? JSON.parse(saved) : initial
  })
  const [prevUser, setPrevUser] = useState(userId)

  const handleValueChange = (newValue: T) => {
    setValue(newValue)
    sessionStorage.setItem(key, JSON.stringify(newValue))
  }

  if (userId !== prevUser) {
    sessionStorage.removeItem(key)
    handleValueChange(initial)
    setPrevUser(userId)
  }

  return [value, handleValueChange] as const
}

export default useSessionStorage
