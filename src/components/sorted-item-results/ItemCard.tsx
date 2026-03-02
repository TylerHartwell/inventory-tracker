import { useState } from "react"
import { Item, LocalItem } from "../ItemManager"
import { deleteItem } from "@/utils/item/deleteItem"
import { updateItem } from "@/utils/item/updateItem"
import ItemCardView from "./ItemCardView"
import ItemCardForm from "./ItemCardForm"

interface ItemCardProps {
  item: LocalItem
  isPriority: boolean
  onDelete: (id: string) => void
}

export type ItemUpdateBundle = {
  updatedFields: Partial<Item>
  itemImage?: File | null
}

export const ItemCard = ({ item, isPriority, onDelete }: ItemCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [displayItem, setDisplayItem] = useState(item)

  const handleCancelEdit = () => {
    setDisplayItem(item)
    setIsEditing(false)
  }

  const handleDeleteItem = async () => {
    if (displayItem.canEdit === false) return

    if (!window.confirm("Are you sure you want to delete this item?")) return

    try {
      const { error } = await deleteItem({ itemId: item.id, imageUrl: item.imageUrl })
      if (error) {
        console.error("Failed to delete item:", error)
        alert("Failed to delete item. Please try again.")
        return
      }

      onDelete(item.id)
    } catch (err) {
      console.error("Failed to delete item:", err)
      alert("An unexpected error occurred while deleting the item.")
    }
  }

  const handleUpdateItem = async ({ updatedFields, itemImage }: ItemUpdateBundle) => {
    if (displayItem.canEdit === false) {
      setIsEditing(false)
      return
    }

    if (Object.values(updatedFields).every(v => v === undefined) && itemImage === undefined) {
      setIsEditing(false)

      return
    }

    if (updatedFields.itemName !== undefined && !updatedFields.itemName.trim()) {
      alert("Item Name is required")

      return
    }

    const optimisticItem: LocalItem = {
      ...displayItem,
      ...updatedFields,
      ...(itemImage !== undefined && {
        signedUrl: itemImage ? URL.createObjectURL(itemImage) : null
      })
    }

    setDisplayItem(optimisticItem)
    setIsEditing(false)

    const { data: updatedItem, error } = await updateItem({
      itemId: item.id,
      itemImageUrl: item.imageUrl,
      itemSignedUrl: item.signedUrl,
      updatedFields,
      updatedImageFile: itemImage
    })

    revokeBlobUrl(optimisticItem.signedUrl)

    if (error || !updatedItem) {
      console.error("Failed to update item:", error)
      setDisplayItem(item)

      return
    }

    setDisplayItem(updatedItem)
  }

  return (
    <li className="border border-gray-300 rounded p-1 mb-1">
      {isEditing ? (
        <ItemCardForm item={displayItem} onCancelEdit={handleCancelEdit} onDeleteItem={handleDeleteItem} onSubmit={handleUpdateItem} />
      ) : (
        <ItemCardView
          viewItem={displayItem}
          isPriority={isPriority}
          onEdit={() => {
            if (displayItem.canEdit === false) return
            setIsEditing(true)
          }}
        />
      )}
    </li>
  )
}

const revokeBlobUrl = (url: string | null) => {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}
