import { useState, useEffect, memo } from "react"
import { LocalItem } from "../ItemManager"
import { deleteItem } from "@/utils/item/deleteItem"
import { updateItem } from "@/utils/item/updateItem"
import isEqual from "lodash.isequal"
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

export const ItemCard = memo(
  ({ item, isPriority }: ItemCardProps) => {
    const [isEditing, setIsEditing] = useState(false)

    const [displayItem, setDisplayItem] = useState(item)

    useEffect(() => {
      setDisplayItem(item)
    }, [item])

    const handleEdit = () => {
      setIsEditing(true)
    }

    const handleCancelEdit = () => {
      setIsEditing(false)
    }

    const handleDeleteItem = async () => {
      if (!window.confirm("Are you sure you want to delete this item?")) return

      try {
        await deleteItem({ item })
      } catch (err) {
        console.error("Failed to delete item:", err)
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

      const { data: updatedItem, error } = await updateItem({ item, updates })

      if (error || !updatedItem) {
        console.error("Failed to update item:", error)
        setDisplayItem(previousItem)
        return
      }
    }

    useEffect(() => {
      return () => {
        if (displayItem.signedUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(displayItem.signedUrl)
        }
      }
    }, [displayItem.signedUrl])

    return (
      <li className="border border-gray-300 rounded p-1 mb-1">
        {isEditing ? (
          <ItemCardForm
            item={item}
            signedUrl={item.signedUrl}
            onCancelEdit={handleCancelEdit}
            onDeleteItem={handleDeleteItem}
            onSubmit={handleUpdateItem}
          />
        ) : (
          <ItemCardView viewItem={displayItem} isPriority={isPriority} onEdit={handleEdit} />
        )}
      </li>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if the item's relevant fields changed
    return prevProps.isPriority === nextProps.isPriority && isEqual(prevProps.item, nextProps.item)
  }
)

ItemCard.displayName = "ItemCard"
