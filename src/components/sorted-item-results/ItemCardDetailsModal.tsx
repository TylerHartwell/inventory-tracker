import Image from "next/image"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { LocalItem } from "../ItemManager"
import ImageLightbox from "./ImageLightbox"

type DetailDisplayField = {
  key: string
  label: string
  value: string
}

interface ItemCardDetailsModalProps {
  displayItem: LocalItem
  isPriority: boolean
  detailDisplayFields: DetailDisplayField[]
  createdAtDisplay: string
  createdByName: string
  lastUpdatedAtDisplay: string
  lastUpdatedByName: string
  onClose: () => void
  onOpenEdit: () => void
}

const ItemCardDetailsModal = ({
  displayItem,
  isPriority,
  detailDisplayFields,
  createdAtDisplay,
  createdByName,
  lastUpdatedAtDisplay,
  lastUpdatedByName,
  onClose,
  onOpenEdit
}: ItemCardDetailsModalProps) => {
  const [detailsLightboxIndex, setDetailsLightboxIndex] = useState<number | null>(null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border rounded-xl bg-black p-3 text-white shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-700 pb-2">
          <h3 className="text-lg font-semibold">Item Details</h3>
          <div className="flex items-center gap-2">
            {!!displayItem.canEdit && (
              <button
                type="button"
                className="h-8 w-8 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1 flex items-center justify-center"
                onClick={onOpenEdit}
                title="Edit item"
              >
                <Pencil size={16} />
              </button>
            )}
            <button
              type="button"
              className="px-3 py-1 bg-gray-600 text-white rounded hover-fine:outline-1 active:outline-1"
              onClick={onClose}
              title="Close details"
            >
              Close
            </button>
          </div>
        </div>

        {displayItem.signedUrls.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {displayItem.signedUrls.map((signedUrl, imageIndex) => (
              <button
                key={`${displayItem.id}-${signedUrl}-${imageIndex}`}
                type="button"
                className="relative h-40 rounded cursor-zoom-in focus:outline-2 focus:outline-blue-400"
                onClick={() => setDetailsLightboxIndex(imageIndex)}
                aria-label={`View image ${imageIndex + 1} of ${displayItem.signedUrls.length}`}
                title="View full image"
              >
                <Image
                  src={signedUrl}
                  unoptimized={
                    signedUrl.startsWith("blob:") || signedUrl.startsWith("http://127.0.0.1:") || signedUrl.startsWith("http://localhost:")
                  }
                  alt="Item image"
                  fill
                  priority={Boolean(isPriority && imageIndex === 0)}
                  loading={isPriority && imageIndex === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 640px) 50vw, 320px"
                  quality={70}
                  className="object-cover rounded"
                />
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-2">
          <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
            <p className="text-xs uppercase tracking-wide text-gray-300">Item Name</p>
            <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{displayItem.itemName}</p>
          </div>

          {detailDisplayFields.map(field => (
            <div key={field.key} className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
              <p className="text-xs uppercase tracking-wide text-gray-300">{field.label}</p>
              <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{field.value}</p>
            </div>
          ))}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
              <p className="text-xs uppercase tracking-wide text-gray-300">Created At</p>
              <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{createdAtDisplay}</p>
            </div>
            <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
              <p className="text-xs uppercase tracking-wide text-gray-300">Created By</p>
              <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{createdByName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
              <p className="text-xs uppercase tracking-wide text-gray-300">Last Updated At</p>
              <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{lastUpdatedAtDisplay}</p>
            </div>
            <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
              <p className="text-xs uppercase tracking-wide text-gray-300">Last Updated By</p>
              <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{lastUpdatedByName}</p>
            </div>
          </div>
        </div>

        {detailsLightboxIndex !== null && (
          <ImageLightbox
            urls={displayItem.signedUrls}
            index={detailsLightboxIndex}
            onClose={() => setDetailsLightboxIndex(null)}
            onNavigate={setDetailsLightboxIndex}
          />
        )}
      </div>
    </div>
  )
}

export default ItemCardDetailsModal
