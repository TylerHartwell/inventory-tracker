import { useState } from "react"
import isEqual from "fast-deep-equal"

function useDeepCompare<T>(value: T): T {
  const [stable, setStable] = useState<T>(value)

  if (!isEqual(value, stable)) {
    setStable(value)
  }

  return stable
}

export default useDeepCompare
