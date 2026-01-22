import { useState, useEffect, memo } from "react"
import { LocalItem } from "./ItemManager"
import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"
import ImageSelector from "./ImageSelector"
import { Session } from "@supabase/supabase-js"
import { deleteItem } from "@/utils/deleteItem"
import { updateItem } from "@/utils/updateItem"
import isEqual from "lodash.isequal"

interface ItemCardProps {
  item: LocalItem
  session: Session
  isPriority: boolean
}

export const ItemCard = memo(
  ({ item, session, isPriority }: ItemCardProps) => {
    const [isEditing, setIsEditing] = useState(false)

    // Single state object for all editable fields
    const [editData, setEditData] = useState({
      itemName: item.item_name,
      extraDetails: item.extra_details,
      itemImage: null as File | null,
      isImageRemoval: false
    })

    // Sync editData whenever item prop changes
    useEffect(() => {
      setEditData({
        itemName: item.item_name,
        extraDetails: item.extra_details,
        itemImage: null,
        isImageRemoval: false
      })
    }, [item.item_name, item.extra_details, item.signedUrl])

    const handleLocalImage = (file: File | null) => {
      setEditData(prev => {
        const isImageRemoval = !file && !!item.image_url && !prev.itemImage

        return {
          ...prev,
          itemImage: file,
          isImageRemoval: file ? false : isImageRemoval || prev.isImageRemoval
        }
      })
    }

    const handleCancelEdit = () => {
      setEditData({
        itemName: item.item_name,
        extraDetails: item.extra_details,
        itemImage: null,
        isImageRemoval: false
      })
      setIsEditing(false)
    }

    const handleDeleteItem = async () => {
      if (!session.user) return
      if (!window.confirm("Are you sure you want to delete this item?")) return

      try {
        await deleteItem({ item, session })
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

      if (editData.itemName.trim() !== item.item_name) updates.itemName = editData.itemName.trim()
      if (editData.extraDetails !== null && editData.extraDetails.trim() !== item.extra_details) updates.extraDetails = editData.extraDetails.trim()
      if (editData.isImageRemoval) updates.itemImage = null
      if (editData.itemImage) updates.itemImage = editData.itemImage

      if (Object.keys(updates).length === 0) {
        setIsEditing(false)
        return
      }

      const { data: updatedItem, error } = await updateItem({ item, session, updates })
      if (error) {
        return
      }
      if (updatedItem) {
        setEditData(prev => ({
          ...prev,
          itemName: updatedItem.item_name,
          extraDetails: updatedItem.extra_details,
          itemImage: null,
          isImageRemoval: false
        }))
        setIsEditing(false)
      }
    }

    return (
      <li key={item.id} className="border border-gray-300 rounded p-1 mb-1">
        {isEditing ? (
          <form
            onSubmit={e => {
              e.preventDefault()
              handleUpdateItem()
            }}
          >
            {/* Editing Mode */}
            <input
              name="item-name"
              value={editData.itemName}
              onChange={e => setEditData(prev => ({ ...prev, itemName: e.target.value }))}
              placeholder="Item Name"
              className="w-full px-1 rounded text-base font-normal border border-gray-300"
            />
            <textarea
              name="extra-details"
              value={editData.extraDetails ?? ""}
              onChange={e => setEditData(prev => ({ ...prev, extraDetails: e.target.value }))}
              placeholder="Extra Details"
              className="w-full px-1 rounded text-base font-normal whitespace-pre-line border border-gray-300 min-h-20"
            />
            <div className="flex items-center mb-2">
              <ImageSelector handleLocalImage={handleLocalImage} signedUrl={item.signedUrl ?? null} />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1"
                onClick={handleCancelEdit}
                title="Cancel editing"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover-fine:outline-1 active:outline-1"
                onClick={handleDeleteItem}
                title="Delete item"
              >
                <Trash2 size={16} />
              </button>
              <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1" title="Save changes">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* View Mode */}
            <div className="flex">
              <p className="w-full text-base font-normal flex-1">{item.item_name}</p>
              <span className="opacity-80">{item.listName}</span>
            </div>

            {item.extra_details && <p className="w-full text-base font-normal whitespace-pre-line max-h-30 overflow-y-auto">{item.extra_details}</p>}
            {item.signedUrl && (
              <div className="relative mb-2 h-40 w-auto">
                <Image src={item.signedUrl} unoptimized alt="Item image" fill priority={isPriority} className="object-contain rounded" />
              </div>
            )}
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1"
                onClick={() => setIsEditing(true)}
                title="Edit item"
              >
                <Pencil size={16} />
              </button>
            </div>
          </>
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
