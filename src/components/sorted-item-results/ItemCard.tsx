import { useState, useEffect } from "react"
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

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    // Revoke any blob URL created during this edit session before closing
    if (displayItem.signedUrl?.startsWith("blob:")) {
      revokeBlobUrl(displayItem.signedUrl)
      // Reset displayItem to the upstream `item` to discard the blob URL
      setDisplayItem(item)
    }
    setIsEditing(false)
  }

  const handleDeleteItem = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) return

    try {
      const { error } = await deleteItem({ itemId: displayItem.id, imageUrl: displayItem.imageUrl })
      if (error) {
        console.error("Failed to delete item:", error)
        alert("Failed to delete item. Please try again.")
        return
      }

      onDelete(displayItem.id)
    } catch (err) {
      console.error("Failed to delete item:", err)
      alert("An unexpected error occurred while deleting the item.")
    }
  }

  const handleUpdateItem = async ({ updatedFields, itemImage }: ItemUpdateBundle) => {
    if (Object.values(updatedFields).every(v => v === undefined) && itemImage === undefined) {
      setIsEditing(false)

      return
    }

    if (updatedFields.itemName !== undefined && !updatedFields.itemName.trim()) {
      alert("Item Name is required")

      return
    }

    const previousItem = displayItem

    const optimisticItem: LocalItem = {
      ...displayItem,
      ...updatedFields,
      ...(itemImage !== undefined && {
        signedUrl: itemImage ? URL.createObjectURL(itemImage) : null
      })
    }

    setDisplayItem(optimisticItem)
    setIsEditing(false)

    const { data: updatedItem, error } = await updateItem({ item: displayItem, updatedFields, itemImage })

    if (error || !updatedItem) {
      console.error("Failed to update item:", error)
      // Revoke any blob URL from the failed optimistic update
      revokeBlobUrl(optimisticItem.signedUrl)
      setDisplayItem(previousItem)
      return
    }

    setDisplayItem({
      ...updatedItem
    })
  }

  // Cleanup blob URLs when component unmounts or when displayItem changes
  useEffect(() => {
    return () => {
      revokeBlobUrl(displayItem.signedUrl)
    }
  }, [displayItem.signedUrl])

  return (
    <li className="border border-gray-300 rounded p-1 mb-1">
      {isEditing ? (
        <ItemCardForm
          item={displayItem}
          signedUrl={displayItem.signedUrl}
          onCancelEdit={handleCancelEdit}
          onDeleteItem={handleDeleteItem}
          onSubmit={handleUpdateItem}
        />
      ) : (
        <ItemCardView viewItem={displayItem} isPriority={isPriority} onEdit={handleEdit} />
      )}
    </li>
  )
}

const revokeBlobUrl = (url: string | null) => {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}

ItemCard.displayName = "ItemCard"
