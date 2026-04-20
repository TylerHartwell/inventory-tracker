import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useEffect } from "react"

type ImageLightboxProps = {
  urls: string[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

const ImageLightbox = ({ urls, index, onClose, onNavigate }: ImageLightboxProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft") {
        if (index > 0) onNavigate(index - 1)
      } else if (e.key === "ArrowRight") {
        if (index < urls.length - 1) onNavigate(index + 1)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [index, urls.length, onClose, onNavigate])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85" onPointerDown={onClose}>
      <button
        type="button"
        className="absolute top-3 right-3 text-white bg-black/50 rounded-full p-1 hover-fine:outline-1 active:outline-1 flex items-center justify-center"
        onClick={onClose}
        onPointerDown={e => e.stopPropagation()}
        aria-label="Close image viewer"
        title="Close image viewer"
      >
        <X size={22} />
      </button>

      {index > 0 && (
        <button
          type="button"
          className="absolute left-3 z-10 text-white rounded-full p-1 flex items-center justify-center hover-fine:scale-110 active:scale-110 transition-transform"
          onClick={() => onNavigate(index - 1)}
          onPointerDown={e => e.stopPropagation()}
          aria-label="Previous image"
          title="View previous image"
        >
          <ChevronLeft size={48} />
        </button>
      )}

      <div className="flex flex-col items-center gap-2 w-full max-w-4xl mx-14 h-[90vh]">
        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center" onPointerDown={onClose}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[index]!}
            alt={`Image ${index + 1} of ${urls.length}`}
            className="max-w-full max-h-full object-contain"
            onPointerDown={e => e.stopPropagation()}
          />
        </div>
        {urls.length > 1 && (
          <span className="shrink-0 text-white text-sm bg-black/50 rounded px-2 py-0.5" onPointerDown={e => e.stopPropagation()}>
            {index + 1} / {urls.length}
          </span>
        )}
      </div>

      {urls.length > 1 && index < urls.length - 1 && (
        <button
          type="button"
          className="absolute right-3 z-10 text-white rounded-full p-1 flex items-center justify-center hover-fine:scale-110 active:scale-110 transition-transform"
          onClick={() => onNavigate(index + 1)}
          onPointerDown={e => e.stopPropagation()}
          aria-label="Next image"
          title="View next image"
        >
          <ChevronRight size={48} />
        </button>
      )}
    </div>
  )
}

export default ImageLightbox
