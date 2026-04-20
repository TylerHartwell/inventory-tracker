import { useEffect, useState } from "react"

export function useScrollThreshold(scrollYThreshold: number = 10) {
  const [isPastThreshold, setIsPastThreshold] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsPastThreshold(window.scrollY > scrollYThreshold)
    }

    handleScroll() // set initial state on mount
    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [scrollYThreshold])

  return isPastThreshold
}
