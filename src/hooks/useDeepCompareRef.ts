import { useRef } from "react"
import isEqual from "fast-deep-equal"

function useDeepCompareRef<T>(value: T): T {
  const ref = useRef<T>(value)

  if (!isEqual(value, ref.current)) {
    ref.current = value
  }

  return ref.current
}

export default useDeepCompareRef
