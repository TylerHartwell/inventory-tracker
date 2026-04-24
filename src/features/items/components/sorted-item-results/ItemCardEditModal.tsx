import { Item, LocalItem } from "@/features/items/components/ItemManager"
import ItemCardForm from "./ItemCardForm"

type ItemUpdateBundle = {
  updatedFields: Partial<Item>
  itemImages?: File[]
  deletedImageIds?: string[]
}

interface ItemCardEditModalProps {
  item: LocalItem
  availableCategories: string[]
  onCancelEdit: () => void
  onDeleteItem: () => Promise<void>
  onSubmit: ({ updatedFields, itemImages, deletedImageIds }: ItemUpdateBundle) => Promise<void>
  showUnsetFields: boolean
  onShowUnsetFieldsChange: (value: boolean) => void
}

const ItemCardEditModal = ({
  item,
  availableCategories,
  onCancelEdit,
  onDeleteItem,
  onSubmit,
  showUnsetFields,
  onShowUnsetFieldsChange
}: ItemCardEditModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80"
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onCancelEdit()
        }
      }}
    >
      <div
        className="w-full m-4 max-w-2xl border rounded-xl bg-black p-3 shadow-lg max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <ItemCardForm
          item={item}
          availableCategories={availableCategories}
          onCancelEdit={onCancelEdit}
          onDeleteItem={onDeleteItem}
          onSubmit={onSubmit}
          showUnsetFields={showUnsetFields}
          onShowUnsetFieldsChange={onShowUnsetFieldsChange}
        />
      </div>
    </div>
  )
}

export default ItemCardEditModal
