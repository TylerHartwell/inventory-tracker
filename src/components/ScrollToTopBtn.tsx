import { useEffect, useState } from "react"

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

const ScrollToTopBtn = () => {
  const [showScrollToTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 10)
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    showScrollToTop && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-2 right-4 w-10 h-10 rounded-full shadow-lg border bg-white cursor-pointer text-black transition"
        aria-label="Scroll to top"
      >
        ↑
      </button>
    )
  )
}

export default ScrollToTopBtn
