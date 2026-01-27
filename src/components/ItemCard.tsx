import { useState, useEffect, memo, useCallback } from "react"
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

export type UpdatePayload = Partial<{
  itemName: string
  extraDetails: string
  itemImage: File | null
  category: string | null
  expiration_date: string | null
  list_id: string | null
}>

export const ItemCard = memo(
  ({ item, session, isPriority }: ItemCardProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isChangingImage, setIsChangingImage] = useState(false)

    const [displayItem, setDisplayItem] = useState(item)

    useEffect(() => {
      setDisplayItem(item)
    }, [item])

    const getInitialForm = useCallback(
      () => ({
        itemName: item.item_name,
        extraDetails: item.extra_details,
        itemImage: null as File | null,
        category: item.category,
        expiration_date: item.expiration_date,
        list_id: item.list_id
      }),
      [item]
    )

    const [form, setForm] = useState(getInitialForm)

    const handleItemImageFile = (file: File | null, isDeletingExisting = false) => {
      setForm(prev => {
        return {
          ...prev,
          itemImage: file
        }
      })

      setIsChangingImage(Boolean(file) || isDeletingExisting)
    }

    const handleCancelEdit = () => {
      setForm(getInitialForm)
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

    const buildUpdates = (): UpdatePayload => {
      const updates: UpdatePayload = {}

      if (form.itemName.trim() !== item.item_name) {
        updates.itemName = form.itemName.trim()
      }

      if (form.extraDetails?.trim() !== item.extra_details) {
        updates.extraDetails = form.extraDetails?.trim()
      }

      if (isChangingImage) {
        updates.itemImage = form.itemImage
      }

      if (form.category !== item.category) {
        updates.category = form.category
      }

      if (form.expiration_date !== item.expiration_date) {
        updates.expiration_date = form.expiration_date
      }

      if (form.list_id !== item.list_id) {
        updates.list_id = form.list_id
      }

      return updates
    }

    const handleUpdateItem = async () => {
      if (!session.user) return

      if (!form.itemName.trim()) {
        alert("Item Name is required")

        return
      }

      const updates = buildUpdates()

      if (Object.keys(updates).length === 0) {
        setIsEditing(false)

        return
      }

      const previousItem = displayItem

      const optimisticItem: LocalItem = {
        ...displayItem,
        ...(updates.itemName && { item_name: updates.itemName }),
        ...(updates.extraDetails !== undefined && { extra_details: updates.extraDetails }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.expiration_date !== undefined && { expiration_date: updates.expiration_date }),
        ...(updates.list_id !== undefined && { list_id: updates.list_id }),
        ...(updates.itemImage !== undefined && {
          signedUrl: updates.itemImage ? URL.createObjectURL(updates.itemImage) : null
        })
      }

      setDisplayItem(optimisticItem)
      setIsEditing(false)

      const { data: updatedItem, error } = await updateItem({ item, session, updates })

      if (error || !updatedItem) {
        console.error("Failed to update item:", error)
        setDisplayItem(previousItem)
      }
    }

    useEffect(() => {
      return () => {
        if (displayItem.signedUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(displayItem.signedUrl)
        }
      }
    }, [displayItem.signedUrl])

    useEffect(() => {
      setForm(getInitialForm)
    }, [getInitialForm])

    return (
      <li className="border border-gray-300 rounded p-1 mb-1">
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
              value={form.itemName}
              onChange={e => setForm(prev => ({ ...prev, itemName: e.target.value }))}
              placeholder="Item Name"
              className="w-full px-1 rounded text-base font-normal border border-gray-300"
            />
            <textarea
              name="extra-details"
              value={form.extraDetails ?? ""}
              onChange={e => setForm(prev => ({ ...prev, extraDetails: e.target.value }))}
              placeholder="Extra Details"
              className="w-full px-1 rounded text-base font-normal whitespace-pre-line border border-gray-300 min-h-20"
            />
            <div className="flex items-center mb-2">
              <ImageSelector onImageFileChange={handleItemImageFile} signedUrl={item.signedUrl} />
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
              <p className="w-full text-base font-normal flex-1">{displayItem.item_name}</p>
              <span className="opacity-80">{displayItem.listName}</span>
            </div>

            {displayItem.extra_details && (
              <p className="w-full text-base font-normal whitespace-pre-line max-h-30 overflow-y-auto">{displayItem.extra_details}</p>
            )}
            {displayItem.signedUrl && (
              <div className="relative mb-2 h-40 w-auto">
                <Image src={displayItem.signedUrl} unoptimized alt="Item image" fill priority={isPriority} className="object-contain rounded" />
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
