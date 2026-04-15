import { Images, List } from "lucide-react"
import Image from "next/image"
import { VisibilityMode } from "../DisplaySection"
import { LocalItem } from "../ItemManager"

type ItemCardStackViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  visibilityMode: VisibilityMode
  useContainImageFit: boolean
}

const ItemCardStackView = ({ viewItem, isPriority, visibilityMode, useContainImageFit }: ItemCardStackViewProps) => {
  const urls = viewItem.signedUrls
  const visibleUrls = urls.slice(0, 4)
  const hasMoreImages = urls.length > 4
  const shouldShowImages = visibilityMode !== "hide-images"
  const shouldShowOnlyImages = visibilityMode === "hide-info"

  return (
    <div className="relative">
      {!shouldShowOnlyImages && (
        <>
          <div className="flex items-between">
            <p className="text-base font-normal flex-2">{viewItem.itemName}</p>
            <span className="opacity-60 ml-4 pr-2 flex items-center justify-end  flex-1">
              <span className="ml-1 text-xs text-right text-balance">{viewItem.listName}</span>
              <List size={16} className="shrink-0 " />
            </span>
          </div>
          {(viewItem.category?.trim() || viewItem.expirationDate) && (
            <div className="mt-1 flex flex-wrap gap-1 text-xs text-gray-200">
              {viewItem.category?.trim() && (
                <span className="rounded border border-gray-600 bg-gray-900 px-2 py-0.5">Category: {viewItem.category.trim()}</span>
              )}
              {viewItem.expirationDate && (
                <span className="rounded border border-gray-600 bg-gray-900 px-2 py-0.5">Expires: {formatStackDate(viewItem.expirationDate)}</span>
              )}
            </div>
          )}
          {viewItem.extraDetails && (
            <p className="w-full text-base font-normal whitespace-pre-line max-h-30 overflow-y-auto">{viewItem.extraDetails}</p>
          )}
        </>
      )}
      {shouldShowImages && visibleUrls.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2 relative">
          {visibleUrls.map((signedUrl, imageIndex) => (
            <div key={`${viewItem.id}-${signedUrl}-${imageIndex}`} className="relative h-32 w-auto rounded">
              <Image
                src={signedUrl}
                unoptimized={signedUrl.startsWith("blob:") || signedUrl.startsWith("http://127.0.0.1:") || signedUrl.startsWith("http://localhost:")}
                alt="Item image"
                fill
                priority={Boolean(isPriority && imageIndex === 0)}
                loading={isPriority && imageIndex === 0 ? "eager" : "lazy"}
                sizes="(max-width: 640px) 50vw, 160px"
                quality={70}
                className={`${useContainImageFit ? "object-contain" : "object-cover"} rounded`}
              />
            </div>
          ))}
          {hasMoreImages && <Images size={20} className="absolute bottom-1 right-1 bg-black/30 rounded p-1 text-white pointer-events-none" />}
        </div>
      )}
      {shouldShowOnlyImages && visibleUrls.length === 0 && <p className=" text-center text-sm text-gray-300">No Image</p>}
    </div>
  )
}

const formatStackDate = (rawValue: string) => {
  const parsed = new Date(rawValue)
  if (Number.isNaN(parsed.getTime())) {
    return rawValue
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

export default ItemCardStackView
