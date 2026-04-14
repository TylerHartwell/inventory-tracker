import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ImageDisplayMode } from "../DisplaySection"
import { LocalItem } from "../ItemManager"

type ItemCardGridViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  imageDisplayMode: ImageDisplayMode
  useContainImageFit: boolean
}

const ItemCardGridView = ({ viewItem, isPriority, imageDisplayMode, useContainImageFit }: ItemCardGridViewProps) => {
  const [gridTitleLines, setGridTitleLines] = useState(1)
  const gridTitleFrameRef = useRef<HTMLParagraphElement>(null)
  const gridTitleTextRef = useRef<HTMLSpanElement>(null)
  const urls = viewItem.signedUrls
  const heroUrl = urls[0]
  const shouldShowImages = imageDisplayMode !== "hide"
  const shouldShowOnlyImages = imageDisplayMode === "only"
  const shouldShowTitle = !shouldShowOnlyImages
  const isBlobUrl = Boolean(heroUrl?.startsWith("blob:"))
  const isLocalDevUrl = Boolean(heroUrl?.startsWith("http://127.0.0.1:") || heroUrl?.startsWith("http://localhost:"))

  useEffect(() => {
    const frame = gridTitleFrameRef.current
    const text = gridTitleTextRef.current

    if (!frame || !text) return

    const updateGridTitleLines = () => {
      const frameHeight = frame.clientHeight
      const computedStyle = window.getComputedStyle(text)
      const lineHeight = Number.parseFloat(computedStyle.lineHeight)
      const verticalPadding = Number.parseFloat(computedStyle.paddingTop) + Number.parseFloat(computedStyle.paddingBottom)

      if (!Number.isFinite(lineHeight) || lineHeight <= 0 || frameHeight <= verticalPadding) {
        setGridTitleLines(1)
        return
      }

      const availableHeight = frameHeight - 16
      const nextLines = Math.max(1, Math.floor((availableHeight - verticalPadding) / lineHeight))

      setGridTitleLines(nextLines)
    }

    updateGridTitleLines()

    const resizeObserver = new ResizeObserver(updateGridTitleLines)
    resizeObserver.observe(frame)

    return () => {
      resizeObserver.disconnect()
    }
  }, [viewItem.itemName])

  return (
    <div className="relative isolate h-full w-full">
      {shouldShowImages && urls.length > 0 && (
        <div className="absolute inset-0 rounded overflow-hidden">
          <Image
            src={heroUrl!}
            unoptimized={isBlobUrl || isLocalDevUrl}
            alt="Item image"
            fill
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={25}
            className={`${useContainImageFit ? "object-contain" : "object-cover"} object-center rounded`}
          />
        </div>
      )}
      {shouldShowTitle && (
        <p
          ref={gridTitleFrameRef}
          className="absolute inset-0 z-10 flex items-center justify-center px-2 text-center text-sm font-medium text-white pointer-events-none overflow-hidden"
        >
          <span
            ref={gridTitleTextRef}
            className="max-w-full overflow-hidden wrap-break-word whitespace-normal bg-black/30 rounded px-2 py-1"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: gridTitleLines
            }}
          >
            {viewItem.itemName}
          </span>
        </p>
      )}
      {shouldShowOnlyImages && urls.length === 0 && (
        <p className="absolute inset-0 z-10 flex items-center justify-center px-2 text-center text-sm font-medium text-gray-300 pointer-events-none">
          No Image
        </p>
      )}
    </div>
  )
}

export default ItemCardGridView
