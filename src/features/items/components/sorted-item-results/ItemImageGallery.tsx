import Image from "next/image"
import type { VisibilityMode } from "@/shared/components/DisplaySection"

export type GalleryImage = {
  key: string
  url: string | null
  itemId: string
  canEdit: boolean
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
  isMultiSelectMode: boolean
  selectedItemIds: Set<string>
  onToggleSelectedItem: (itemId: string) => void
}

const ItemImageGallery = ({
  images,
  gridColumns,
  visibilityMode,
  useContainImageFit,
  onOpenItem,
  isMultiSelectMode,
  selectedItemIds,
  onToggleSelectedItem
}: ItemImageGalleryProps) => {
  const gridColumnClass = gridColumns === 1 ? "grid-cols-1" : gridColumns === 2 ? "grid-cols-2" : gridColumns === 3 ? "grid-cols-3" : "grid-cols-4"
  const shouldHideOverlay = visibilityMode === "hide-info"

  if (images.length === 0) {
    return <div className="text-center">- No Images In Results -</div>
  }

  return (
    <ul className={`list-none p-0 grid ${gridColumnClass} gap-2`}>
      {images.map(image => {
        const isSelected = selectedItemIds.has(image.itemId)

        if (!image.url) {
          return (
            <li key={image.key} className="relative">
              <button
                type="button"
                className="relative block w-full cursor-pointer overflow-hidden rounded border border-gray-700 bg-black"
                onClick={() => onOpenItem(image.itemId)}
                aria-label={`Open ${image.itemName} details`}
                title={`Open details for ${image.itemName}`}
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
              </button>
              {isMultiSelectMode && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelectedItem(image.itemId)}
                  onClick={event => event.stopPropagation()}
                  disabled={!image.canEdit}
                  className="h-4 w-4 shrink-0 accent-blue-500 cursor-pointer disabled:cursor-not-allowed absolute right-0 top-0 -translate-y-1/3 translate-x-1/3"
                  title={isSelected ? "Deselect item" : "Select item"}
                />
              )}
            </li>
          )
        }

        const isBlobOrLocal = image.url.startsWith("blob:") || image.url.startsWith("http://127.0.0.1:") || image.url.startsWith("http://localhost:")

        return (
          <li key={image.key} className="relative">
            <button
              type="button"
              className="group relative block h-full w-full cursor-pointer overflow-hidden rounded border border-gray-700 bg-black"
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
            {isMultiSelectMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelectedItem(image.itemId)}
                onClick={event => event.stopPropagation()}
                disabled={!image.canEdit}
                className="h-4 w-4 shrink-0 accent-blue-500 cursor-pointer disabled:cursor-not-allowed absolute right-0 top-0 -translate-y-1/3 translate-x-1/3"
                title={isSelected ? "Deselect item" : "Select item"}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default ItemImageGallery
