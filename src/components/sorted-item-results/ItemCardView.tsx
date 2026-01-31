import { Pencil } from "lucide-react"
import Image from "next/image"
import { LocalItem } from "../ItemManager"

type ItemCardViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  onEdit: () => void
}

const ItemCardView = ({ viewItem, isPriority, onEdit }: ItemCardViewProps) => {
  return (
    <div>
      <div className="flex">
        <p className="w-full text-base font-normal flex-1">{viewItem.itemName}</p>
        <span className="opacity-80">{viewItem.listName}</span>
      </div>
      {viewItem.extraDetails && <p className="w-full text-base font-normal whitespace-pre-line max-h-30 overflow-y-auto">{viewItem.extraDetails}</p>}
      {viewItem.signedUrl && (
        <div className="relative mb-2 h-40 w-auto">
          <Image src={viewItem.signedUrl} unoptimized alt="Item image" fill priority={isPriority} className="object-contain rounded" />
        </div>
      )}
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1" onClick={onEdit} title="Edit item">
          <Pencil size={16} />
        </button>
      </div>
    </div>
  )
}

export default ItemCardView
