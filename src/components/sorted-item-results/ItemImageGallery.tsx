import Image from "next/image"
import { useMemo, useState } from "react"
import type { VisibilityMode } from "../DisplaySection"
import ImageLightbox from "./ImageLightbox"

export type GalleryImage = {
  key: string
  url: string | null
  itemName: string
  listName: string
}

type GridColumns = 1 | 2 | 3 | 4

type ItemImageGalleryProps = {
  images: GalleryImage[]
  gridColumns: GridColumns
  visibilityMode: VisibilityMode
  useContainImageFit: boolean
}

const ItemImageGallery = ({ images, gridColumns, visibilityMode, useContainImageFit }: ItemImageGalleryProps) => {
  const gridColumnClass = gridColumns === 1 ? "grid-cols-1" : gridColumns === 2 ? "grid-cols-2" : gridColumns === 3 ? "grid-cols-3" : "grid-cols-4"
  const shouldHideOverlay = visibilityMode === "hide-info"
  const [openImageIndex, setOpenImageIndex] = useState<number | null>(null)
  const lightboxImages = useMemo(() => images.filter(image => image.url !== null), [images])
  const lightboxUrls = useMemo(() => lightboxImages.map(image => image.url!), [lightboxImages])

  if (images.length === 0) {
    return <div className="text-center">- No Images In Results -</div>
  }

  return (
    <>
      <ul className={`list-none p-0 grid ${gridColumnClass} gap-2`}>
        {images.map(image => {
          if (!image.url) {
            return (
              <li key={image.key} className="relative overflow-hidden rounded border border-gray-700 bg-black">
                <div className="flex aspect-square items-center justify-center px-2">
                  <p className="text-sm text-gray-300">No Image</p>
                </div>
                {!shouldHideOverlay && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-left">
                    <p className="truncate text-xs text-white">{image.itemName}</p>
                    <p className="truncate text-[11px] text-gray-300">{image.listName}</p>
                  </div>
                )}
              </li>
            )
          }

          const lightboxIndex = lightboxImages.findIndex(lightboxImage => lightboxImage.key === image.key)
          const isBlobOrLocal =
            image.url.startsWith("blob:") || image.url.startsWith("http://127.0.0.1:") || image.url.startsWith("http://localhost:")

          return (
            <li key={image.key} className="relative overflow-hidden rounded border border-gray-700 bg-black">
              <button
                type="button"
                className="group relative block h-full w-full cursor-zoom-in"
                onClick={() => setOpenImageIndex(lightboxIndex)}
                aria-label={`Open ${image.itemName} image`}
                title={`Open image for ${image.itemName}`}
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={image.url}
                    unoptimized={isBlobOrLocal}
                    alt={`${image.itemName} image`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={70}
                    className={useContainImageFit ? "object-contain" : "object-cover"}
                  />
                </div>
                {!shouldHideOverlay && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-left">
                    <p className="truncate text-xs text-white">{image.itemName}</p>
                    <p className="truncate text-[11px] text-gray-300">{image.listName}</p>
                  </div>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {openImageIndex !== null && (
        <ImageLightbox urls={lightboxUrls} index={openImageIndex} onClose={() => setOpenImageIndex(null)} onNavigate={setOpenImageIndex} />
      )}
    </>
  )
}

export default ItemImageGallery
