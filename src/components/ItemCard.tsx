import { useState, useEffect, memo } from "react"
import { Item } from "./ItemManager"
import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"
import ImageSelector from "./ImageSelector"
import { Session } from "@supabase/supabase-js"
import { deleteItem } from "@/utils/deleteItem"
import { updateItem } from "@/utils/updateItem"
import isEqual from "lodash.isequal"

interface ItemCardProps {
  item: Item
  session: Session
  isPriority: boolean
}

export const ItemCard = memo(
  ({ item, session, isPriority }: ItemCardProps) => {
    const [isEditing, setIsEditing] = useState(false)

    // Single state object for all editable fields
    const [editData, setEditData] = useState({
      itemName: item.itemName,
      extraDetails: item.extraDetails,
      itemImage: null as File | null,
      isImageRemoval: false
    })

    // Sync editData whenever item prop changes
    useEffect(() => {
      setEditData({
        itemName: item.itemName,
        extraDetails: item.extraDetails,
        itemImage: null,
        isImageRemoval: false
      })
    }, [item.itemName, item.extraDetails, item.signedUrl])

    const handleLocalImage = (file: File | null) => {
      setEditData(prev => ({
        ...prev,
        itemImage: file,
        isImageRemoval: !file && !!item.image_url
      }))
    }

    const handleCancelEdit = () => {
      setEditData({
        itemName: item.itemName,
        extraDetails: item.extraDetails,
        itemImage: null,
        isImageRemoval: false
      })
      setIsEditing(false)
    }

    const handleDeleteItem = async () => {
      if (!session.user) return
      if (!window.confirm("Are you sure you want to delete this item?")) return

      try {
        await deleteItem(item, session)
      } catch (err) {
        console.error("Failed to delete item:", err)
      }
    }

    const handleUpdateItem = async () => {
      if (!session.user) return
      if (!editData.itemName.trim()) {
        alert("Item Name is required")
        return
      }

      const updates: Partial<{
        itemName: string
        extraDetails: string
        itemImage: File | null
      }> = {}

      if (editData.itemName.trim() !== item.itemName) updates.itemName = editData.itemName.trim()
      if (editData.extraDetails.trim() !== item.extraDetails) updates.extraDetails = editData.extraDetails.trim()
      if (editData.isImageRemoval) updates.itemImage = null
      if (editData.itemImage) updates.itemImage = editData.itemImage

      if (Object.keys(updates).length === 0) {
        setIsEditing(false)
        return
      }

      try {
        const updatedItem = await updateItem(item, session, updates)
        if (updatedItem) {
          setEditData(prev => ({
            ...prev,
            itemName: updatedItem.itemName,
            extraDetails: updatedItem.extraDetails,
            itemImage: null,
            isImageRemoval: false
          }))
          setIsEditing(false)
        }
      } catch (err) {
        console.error("Update failed:", err)
      }
    }

    return (
      <li key={item.id} className="border border-gray-300 rounded p-4 mb-2">
        {/* Item Name */}
        {isEditing ? (
          <input
            value={editData.itemName}
            onChange={e => setEditData(prev => ({ ...prev, itemName: e.target.value }))}
            placeholder="Item Name"
            className="w-full p-2 rounded text-base font-normal border border-gray-300"
          />
        ) : (
          <p className="w-full p-2 text-base font-normal">{item.itemName}</p>
        )}

        {/* Extra Details */}
        {isEditing ? (
          <textarea
            value={editData.extraDetails}
            onChange={e => setEditData(prev => ({ ...prev, extraDetails: e.target.value }))}
            placeholder="Extra Details"
            className="w-full p-2 rounded text-base font-normal whitespace-pre-line border border-gray-300 min-h-20"
          />
        ) : item.extraDetails ? (
          <p className="w-full p-2 text-base font-normal whitespace-pre-line max-h-30 overflow-y-auto">{item.extraDetails}</p>
        ) : null}

        {/* Image Selector */}
        {isEditing && (
          <div className="flex items-center mb-2">
            <ImageSelector handleLocalImage={handleLocalImage} signedUrl={item.signedUrl ?? null} />
          </div>
        )}

        {/* Display image */}
        {!isEditing && item.signedUrl && (
          <div className="relative mb-2 h-40 w-auto">
            <Image src={item.signedUrl} unoptimized alt="Item image" fill priority={isPriority} className="object-contain rounded" />
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2 flex justify-between">
          {isEditing ? (
            <>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={handleUpdateItem}>
                Update
              </button>
            </>
          ) : (
            <>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={() => setIsEditing(true)}>
                <Pencil size={16} />
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={handleDeleteItem}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </li>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if the item's relevant fields changed
    return prevProps.isPriority === nextProps.isPriority && isEqual(prevProps.item, nextProps.item)
  }
)

ItemCard.displayName = "ItemCard"
