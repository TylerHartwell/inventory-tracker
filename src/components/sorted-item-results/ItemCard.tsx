import { useState, useEffect } from "react"
import { LocalItem } from "../ItemManager"
import { deleteItem } from "@/utils/item/deleteItem"
import { updateItem } from "@/utils/item/updateItem"
import { generateSignedUrl } from "@/utils/generateSignedUrl"
import ItemCardView from "./ItemCardView"
import ItemCardForm from "./ItemCardForm"

interface ItemCardProps {
  item: LocalItem
  isPriority: boolean
}

export type UpdatePayload = Partial<
  Pick<LocalItem, "itemName" | "listId" | "extraDetails" | "category" | "expirationDate"> & {
    itemImage: File | null
  }
>

export const ItemCard = ({ item, isPriority }: ItemCardProps) => {
  const [isEditing, setIsEditing] = useState(false)

  const [displayItem, setDisplayItem] = useState(item)

  // Helper to safely revoke blob URLs

  useEffect(() => {
    // Always sync with the upstream `item` prop so the form updates
    // live if the database changes while the user is editing.
    setDisplayItem(item)
  }, [item])

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
      }
    } catch (err) {
      console.error("Failed to delete item:", err)
      alert("An unexpected error occurred while deleting the item.")
    }
  }

  const handleUpdateItem = async (updates: UpdatePayload) => {
    if (Object.keys(updates).length === 0) {
      setIsEditing(false)

      return
    }

    if (updates.itemName !== undefined && !updates.itemName.trim()) {
      alert("Item Name is required")

      return
    }

    const previousItem = displayItem

    const optimisticItem: LocalItem = {
      ...displayItem,
      ...(updates.itemName !== undefined && { itemName: updates.itemName }),
      ...(updates.extraDetails !== undefined && { extraDetails: updates.extraDetails }),
      ...(updates.itemImage !== undefined && {
        signedUrl: updates.itemImage ? URL.createObjectURL(updates.itemImage) : null
      })
    }

    setDisplayItem(optimisticItem)
    setIsEditing(false)

    const { data: updatedItem, error } = await updateItem({ item: displayItem, updates })

    if (error || !updatedItem) {
      console.error("Failed to update item:", error)
      // Revoke any blob URL from the failed optimistic update
      revokeBlobUrl(optimisticItem.signedUrl)
      setDisplayItem(previousItem)
      return
    }

    // Update displayItem with the actual database response to ensure signedUrl is correct
    let signedUrl: string | null = null
    if (updatedItem.imageUrl) {
      try {
        signedUrl = await generateSignedUrl(updatedItem.imageUrl)
      } catch (err) {
        console.error("Failed to generate signed URL:", err)
        signedUrl = null
      }
    }

    const updatedLocalItem: LocalItem = {
      ...updatedItem,
      signedUrl,
      listName: displayItem.listName
    }
    setDisplayItem(updatedLocalItem)
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
