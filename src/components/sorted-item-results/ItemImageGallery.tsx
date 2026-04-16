import Image from "next/image"
import type { VisibilityMode } from "../DisplaySection"

export type GalleryImage = {
  key: string
  url: string | null
  itemId: string
  itemName: string
  listName: string
  itemImageNumber: number | null
  itemImageTotal: number | null
}

type GridColumns = 1 | 2 | 3 | 4

type ItemImageGalleryProps = {
  images: GalleryImage[]
  gridColumns: GridColumns
  visibilityMode: VisibilityMode
  useContainImageFit: boolean
  onOpenItem: (itemId: string) => void
}

const ItemImageGallery = ({ images, gridColumns, visibilityMode, useContainImageFit, onOpenItem }: ItemImageGalleryProps) => {
  const gridColumnClass = gridColumns === 1 ? "grid-cols-1" : gridColumns === 2 ? "grid-cols-2" : gridColumns === 3 ? "grid-cols-3" : "grid-cols-4"
  const shouldHideOverlay = visibilityMode === "hide-info"

  if (images.length === 0) {
    return <div className="text-center">- No Images In Results -</div>
  }

  return (
    <ul className={`list-none p-0 grid ${gridColumnClass} gap-2`}>
      {images.map(image => {
        if (!image.url) {
          return (
            <li
              key={image.key}
              className="relative overflow-hidden rounded border border-gray-700 bg-black cursor-pointer"
              onClick={() => onOpenItem(image.itemId)}
            >
              <div className="flex aspect-square items-center justify-center px-2">
                <p className="text-sm text-gray-300">No Image</p>
              </div>
              {!shouldHideOverlay && (
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-black/60 px-2 py-1">
                  <div className="min-w-0 text-left">
                    <p className="truncate text-xs text-white">{image.itemName}</p>
                    <p className="truncate text-[11px] text-gray-300">{image.listName}</p>
                  </div>
                </div>
              )}
            </li>
          )
        }

        const isBlobOrLocal = image.url.startsWith("blob:") || image.url.startsWith("http://127.0.0.1:") || image.url.startsWith("http://localhost:")

        return (
          <li key={image.key} className="relative overflow-hidden rounded border border-gray-700 bg-black">
            <button
              type="button"
              className="group relative block h-full w-full cursor-pointer"
              onClick={() => onOpenItem(image.itemId)}
              aria-label={`Open ${image.itemName} details`}
              title={`Open details for ${image.itemName}`}
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
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-black/40 px-2 py-1">
                  <div className="min-w-0 text-left">
                    <p className="truncate text-xs text-white">{image.itemName}</p>
                    <p className="truncate text-[11px] text-gray-300">{image.listName}</p>
                  </div>
                  {image.itemImageNumber !== null && image.itemImageTotal !== null && image.itemImageTotal > 1 && (
                    <p className="shrink-0 text-[11px] font-medium text-gray-100">
                      {image.itemImageNumber}/{image.itemImageTotal}
                    </p>
                  )}
                </div>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default ItemImageGallery
