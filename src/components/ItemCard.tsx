import { useState } from "react"
import { Item } from "./ItemManager"
import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"
import ImageSelector from "./ImageSelector"
import { Session } from "@supabase/supabase-js"
import { deleteItem } from "@/utils/deleteItem"
import { updateItem } from "@/utils/updateItem"

export const ItemCard = ({ item, session, isPriority }: { item: Item; session: Session; isPriority: boolean }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [itemName, setItemName] = useState<string>(item.itemName)
  const [extraDetails, setExtraDetails] = useState<string>(item.extraDetails)
  const [itemImage, setItemImage] = useState<File | null>(null)
  const [isImageRemoval, setIsImageRemoval] = useState<boolean>(false)

  const handleLocalImage = (file: File | null) => {
    setItemImage(file)
    if (!file && item.image_url) setIsImageRemoval(true)
  }

  const handleCancelEdit = () => {
    setItemName(item.itemName)
    setExtraDetails(item.extraDetails)
    setIsEditing(false)
  }

  const handleDeleteItem = async () => {
    if (!session.user) {
      console.error("Not authenticated")
      return
    }
    try {
      if (window.confirm("Are you sure you want to delete this item?")) {
        await deleteItem(item, session)
      }
    } catch (err) {
      console.error("Failed to delete item:", err)
    }
  }

  const handleUpdateItem = async () => {
    if (!session.user) {
      console.error("Not authenticated")
      return
    }

    if (!itemName.trim()) {
      alert("Item Name is required")
      return
    }

    const updates: Partial<{ itemName: string; extraDetails: string; itemImage: File | null }> = {}

    if (itemName.trim() && itemName !== item.itemName) {
      updates.itemName = itemName.trim()
    }

    if (extraDetails.trim() !== item.extraDetails) {
      updates.extraDetails = extraDetails.trim()
    }

    if (isImageRemoval) {
      updates.itemImage = null
    }

    if (itemImage) {
      updates.itemImage = itemImage
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false)
      return
    }

    try {
      await updateItem(item, session, updates)
    } catch (err) {
      console.error("Unexpected error:", err)
      return
    }

    if (updates.itemName) setItemName(updates.itemName)
    if (updates.extraDetails) setExtraDetails(updates.extraDetails)
    if (itemImage) setItemImage(null)
    if (isImageRemoval) setIsImageRemoval(false)

    setIsEditing(false)
  }

  return (
    <li key={item.id} className="border border-gray-300 rounded p-4 mb-2">
      <div>
        {/* Item Name */}
        {isEditing ? (
          <input
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder="Updated item name..."
            className="w-full p-2 rounded text-base font-normal border border-gray-300"
          />
        ) : (
          <p className="w-full p-2 text-base font-normal">{itemName}</p>
        )}

        {/* ExtraDetails */}
        {isEditing ? (
          <textarea
            value={extraDetails}
            onChange={e => setExtraDetails(e.target.value)}
            placeholder={"Updated extraDetails..."}
            className={"w-full p-2 rounded text-base font-normal whitespace-pre-line border border-gray-300 min-h-20"}
          />
        ) : extraDetails ? (
          <p className="w-full p-2 text-base font-normal whitespace-pre-line max-h-30 overflow-y-auto">{extraDetails}</p>
        ) : null}

        {/* Image selector only editable when editing */}
        {isEditing && (
          <div className="flex items-center mb-2">
            <ImageSelector handleLocalImage={handleLocalImage} signedUrl={item.signedUrl ?? null} />
          </div>
        )}

        {/* Display image */}
        {item.signedUrl && !isEditing && (
          <div className="relative mb-2 h-40 w-auto">
            <Image src={item.signedUrl} unoptimized alt="Item image" fill priority={isPriority} className="object-contain rounded" />
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2">
          <div className="flex space-x-2 justify-between">
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
        </div>
      </div>
    </li>
  )
}
