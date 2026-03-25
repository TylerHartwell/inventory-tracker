import { Pencil } from "lucide-react"
import Image from "next/image"
import { LocalItem } from "../ItemManager"

type ItemCardViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  onEdit: () => void
  showEditButton?: boolean
}

const ItemCardView = ({ viewItem, isPriority, onEdit, showEditButton = true }: ItemCardViewProps) => {
  return (
    <div className="relative">
      <div className="flex">
        <p className="w-full text-base font-normal flex-1">{viewItem.itemName}</p>
        <span className="opacity-80 pr-6">{viewItem.listName}</span>
      </div>
      {viewItem.extraDetails && <p className="w-full text-base font-normal whitespace-pre-line max-h-30 overflow-y-auto">{viewItem.extraDetails}</p>}
      {viewItem.signedUrls.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {viewItem.signedUrls.map((signedUrl, imageIndex) => (
            <div key={`${viewItem.id}-${signedUrl}-${imageIndex}`} className="relative h-32 w-auto">
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

      {!!viewItem.canEdit && showEditButton && (
        <button
          className="h-5 w-5 px-0.5 py-0.5 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1 absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 flex items-center justify-center"
          onClick={onEdit}
          title="Edit item"
        >
          <Pencil size={16} />
        </button>
      )}
    </div>
  )
}

export default ItemCardView
