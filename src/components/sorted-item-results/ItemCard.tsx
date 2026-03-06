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

type FeedbackTone = "info" | "error"

type FeedbackState = {
  tone: FeedbackTone
  message: string
}

export const ItemCard = ({ item, isPriority, onDelete }: ItemCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [displayItem, setDisplayItem] = useState(item)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const clearFeedback = () => setFeedback(null)

  const handleCancelEdit = () => {
    setDisplayItem(item)
    clearFeedback()
    setIsEditing(false)
  }

  const handleDeleteItem = async () => {
    if (displayItem.canEdit === false) return

    try {
      const { error } = await deleteItem({ itemId: item.id, imageUrl: item.imageUrl })
      if (error) {
        console.error("Failed to delete item:", error)
        setFeedback({ tone: "error", message: "Failed to delete item. Please try again." })
        return
      }

      onDelete(item.id)
    } catch (err) {
      console.error("Failed to delete item:", err)
      setFeedback({ tone: "error", message: "An unexpected error occurred while deleting the item." })
    }
  }

  const handleUpdateItem = async ({ updatedFields, itemImage }: ItemUpdateBundle) => {
    if (displayItem.canEdit === false) {
      setIsEditing(false)
      return
    }

    if (Object.values(updatedFields).every(v => v === undefined) && itemImage === undefined) {
      setFeedback({ tone: "info", message: "No changes to save." })
      setIsEditing(false)

      return
    }

    if (updatedFields.itemName !== undefined && !updatedFields.itemName.trim()) {
      setFeedback({ tone: "error", message: "Item name is required." })

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
    clearFeedback()
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
      setFeedback({ tone: "error", message: "Failed to update item. Please try again." })

      return
    }

    setDisplayItem(updatedItem)
  }

  const feedbackClass = feedback
    ? feedback.tone === "error"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-blue-700 bg-blue-50 border-blue-200"
    : ""

  return (
    <li
      className="border border-gray-300 rounded p-1 mb-1"
      onPointerDownCapture={() => {
        if (feedback) clearFeedback()
      }}
      onKeyDownCapture={() => {
        if (feedback) clearFeedback()
      }}
    >
      {feedback && <p className={`mb-2 rounded border px-2 py-1 text-sm ${feedbackClass}`}>{feedback.message}</p>}
      {isEditing ? (
        <ItemCardForm item={displayItem} onCancelEdit={handleCancelEdit} onDeleteItem={handleDeleteItem} onSubmit={handleUpdateItem} />
      ) : (
        <ItemCardView
          viewItem={displayItem}
          isPriority={isPriority}
          onEdit={() => {
            if (displayItem.canEdit === false) return
            clearFeedback()
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
