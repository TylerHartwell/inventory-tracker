import { Item, LocalItem } from "../ItemManager"
import ItemCardForm from "./ItemCardForm"

type ItemUpdateBundle = {
  updatedFields: Partial<Item>
  itemImages?: File[]
  deletedImageIds?: string[]
}

interface ItemCardEditModalProps {
  item: LocalItem
  onCancelEdit: () => void
  onDeleteItem: () => Promise<void>
  onSubmit: ({ updatedFields, itemImages, deletedImageIds }: ItemUpdateBundle) => Promise<void>
}

const ItemCardEditModal = ({ item, onCancelEdit, onDeleteItem, onSubmit }: ItemCardEditModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onCancelEdit()
        }
      }}
    >
      <div className="w-full max-w-xl border rounded-xl bg-black p-3 shadow-lg" onClick={e => e.stopPropagation()}>
        <ItemCardForm item={item} onCancelEdit={onCancelEdit} onDeleteItem={onDeleteItem} onSubmit={onSubmit} />
      </div>
    </div>
  )
}

export default ItemCardEditModal
