import { List, Pencil } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { LocalItem } from "../ItemManager"
import ImageLightbox from "./ImageLightbox"

type ItemCardViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  onEdit: () => void
  showEditButton?: boolean
}

const ItemCardView = ({ viewItem, isPriority, onEdit, showEditButton = true }: ItemCardViewProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const urls = viewItem.signedUrls
  const isOpen = lightboxIndex !== null

  return (
    <div className="relative">
      <div className="flex">
        <p className="w-full text-base font-normal flex-1">{viewItem.itemName}</p>
        <span className="opacity-80 pr-6 flex items-center">
          <List size={16} />
          <span className="ml-1">{viewItem.listName}</span>
        </span>
      </div>
      {viewItem.extraDetails && <p className="w-full text-base font-normal whitespace-pre-line max-h-30 overflow-y-auto">{viewItem.extraDetails}</p>}
      {urls.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {urls.map((signedUrl, imageIndex) => (
            <button
              key={`${viewItem.id}-${signedUrl}-${imageIndex}`}
              type="button"
              className="relative h-32 w-auto cursor-zoom-in focus:outline-2 focus:outline-blue-400 rounded"
              onClick={() => setLightboxIndex(imageIndex)}
              aria-label={`View image ${imageIndex + 1} of ${urls.length}`}
            >
              <Image
                src={signedUrl}
                unoptimized
                alt="Item image"
                fill
                priority={Boolean(isPriority && imageIndex === 0)}
                className="object-cover rounded"
              />
            </button>
          ))}
        </div>
      )}

      {!!viewItem.canEdit && showEditButton && (
        <button
          className="h-5 w-5 px-0.5 py-0.5 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1 absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 flex items-center justify-center"
          onClick={onEdit}
          title="Edit item"
        >
          <Pencil size={16} />
        </button>
      )}

      {isOpen && lightboxIndex !== null && (
        <ImageLightbox urls={urls} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
    </div>
  )
}

export default ItemCardView
