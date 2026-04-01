import { useScrollThreshold } from "@/hooks/useScrollThreshold"

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

const ScrollToTopBtn = () => {
  const showScrollToTop = useScrollThreshold(10)

  return (
    showScrollToTop && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-2 right-4 w-10 h-10 rounded-full shadow-lg border bg-white cursor-pointer text-black transition"
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        ↑
      </button>
    )
  )
}

export default ScrollToTopBtn
