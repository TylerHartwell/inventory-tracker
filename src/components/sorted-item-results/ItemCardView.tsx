import { List } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { LocalItem } from "../ItemManager"

type ItemCardViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  isGridMode?: boolean
}

const ItemCardView = ({ viewItem, isPriority, isGridMode = false }: ItemCardViewProps) => {
  const [gridTitleLines, setGridTitleLines] = useState(1)
  const gridTitleFrameRef = useRef<HTMLParagraphElement>(null)
  const gridTitleTextRef = useRef<HTMLSpanElement>(null)
  const urls = viewItem.signedUrls

  useEffect(() => {
    if (!isGridMode) return

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
  }, [isGridMode, viewItem.itemName])

  if (isGridMode) {
    return (
      <div className="relative h-full w-full">
        {urls.length > 0 && (
          <div className="absolute inset-0 rounded overflow-hidden">
            <Image src={urls[0]!} unoptimized alt="Item image" fill priority={isPriority} className="object-cover object-center rounded" />
          </div>
        )}
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
      </div>
    )
  }

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
            <div key={`${viewItem.id}-${signedUrl}-${imageIndex}`} className="relative h-32 w-auto rounded">
              <Image
                src={signedUrl}
                unoptimized
                alt="Item image"
                fill
                priority={Boolean(isPriority && imageIndex === 0)}
                className="object-cover rounded"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ItemCardView
