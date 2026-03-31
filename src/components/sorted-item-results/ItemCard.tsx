import Image from "next/image"
import { Pencil, Images } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Item, LocalItem } from "../ItemManager"
import { deleteItem } from "@/utils/item/deleteItem"
import { updateItem } from "@/utils/item/updateItem"
import ItemCardView from "./ItemCardView"
import ItemCardForm from "./ItemCardForm"
import ImageLightbox from "./ImageLightbox"
import { supabase } from "@/supabase-client"

interface ItemCardProps {
  item: LocalItem
  isPriority: boolean
  onDelete: (id: string) => void
  isMultiSelectMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
  isGridMode?: boolean
}

export type ItemUpdateBundle = {
  updatedFields: Partial<Item>
  itemImages?: File[]
  deletedImageIds?: string[]
}

type FeedbackTone = "info" | "error"

type FeedbackState = {
  tone: FeedbackTone
  message: string
}

export const ItemCard = ({ item, isPriority, onDelete, isMultiSelectMode, isSelected, onToggleSelect, isGridMode = false }: ItemCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsLightboxIndex, setDetailsLightboxIndex] = useState<number | null>(null)
  const [displayItem, setDisplayItem] = useState(item)
  const [usernamesById, setUsernamesById] = useState<Record<string, string | null>>({})
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const clearFeedback = () => setFeedback(null)

  const detailFields = useMemo(() => {
    const hiddenKeys = new Set([
      "id",
      "itemName",
      "signedUrls",
      "itemImages",
      "imageUrls",
      "imageIds",
      "canEdit",
      "listName",
      "userId",
      "createdAt",
      "lastUpdatedAt",
      "lastUpdatedBy"
    ])

    return Object.entries(displayItem).filter(([key, value]) => {
      if (hiddenKeys.has(key)) {
        return false
      }

      const displayValue = key === "listId" ? displayItem.listName : value
      return hasDisplayFieldValue(displayValue)
    })
  }, [displayItem])

  const createdByName = useMemo(() => {
    return resolveUserLabel(displayItem.userId, usernamesById)
  }, [displayItem.userId, usernamesById])

  const lastUpdatedByName = useMemo(() => {
    return resolveUserLabel(displayItem.lastUpdatedBy, usernamesById)
  }, [displayItem.lastUpdatedBy, usernamesById])

  useEffect(() => {
    const userIds = [...new Set(collectUserIds(displayItem))]

    if (userIds.length === 0) {
      return
    }

    let cancelled = false

    const loadUsernames = async () => {
      const { data, error } = await supabase.from("profiles").select("id, username").in("id", userIds)

      if (cancelled) return

      if (error || !data) {
        console.error("Failed to load usernames for item details:", error)
        setUsernamesById({})
        return
      }

      const nextMap: Record<string, string | null> = {}
      for (const profile of data) {
        nextMap[profile.id] = profile.username
      }

      setUsernamesById(nextMap)
    }

    loadUsernames()

    return () => {
      cancelled = true
    }
  }, [displayItem])

  const handleCancelEdit = () => {
    setDisplayItem(item)
    clearFeedback()
    setIsEditing(false)
  }

  const handleDeleteItem = async () => {
    if (displayItem.canEdit === false) return

    try {
      const { error } = await deleteItem({ itemId: item.id })
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

  const handleUpdateItem = async ({ updatedFields, itemImages, deletedImageIds }: ItemUpdateBundle) => {
    if (displayItem.canEdit === false) {
      setIsEditing(false)
      return
    }

    if (Object.values(updatedFields).every(v => v === undefined) && itemImages === undefined && deletedImageIds === undefined) {
      setIsEditing(false)

      return
    }

    if (updatedFields.itemName !== undefined && !updatedFields.itemName.trim()) {
      setFeedback({ tone: "error", message: "Item name is required." })

      return
    }

    const deletedIdsSet = new Set(deletedImageIds ?? [])
    const remainingExistingImages = displayItem.signedUrls.filter((_signedUrl, index) => {
      const id = displayItem.imageIds[index]
      return id !== undefined && !deletedIdsSet.has(id)
    })
    const newImageBlobUrls = (itemImages ?? []).map(file => URL.createObjectURL(file))

    const optimisticItem: LocalItem = {
      ...displayItem,
      ...updatedFields,
      imageIds: displayItem.imageIds.filter(imageId => !deletedIdsSet.has(imageId)),
      imageUrls: displayItem.imageUrls.filter((_imageUrl, index) => {
        const id = displayItem.imageIds[index]
        return id !== undefined && !deletedIdsSet.has(id)
      }),
      signedUrls: [...remainingExistingImages, ...newImageBlobUrls]
    }

    setDisplayItem(optimisticItem)
    clearFeedback()
    setIsEditing(false)
    setIsDetailsOpen(false)

    const { data: updatedItem, error } = await updateItem({
      itemId: item.id,
      updatedFields,
      updatedImageFiles: itemImages,
      deletedImageIds
    })

    revokeBlobUrls(newImageBlobUrls)

    if (error || !updatedItem) {
      console.error("Failed to update item:", error)
      setDisplayItem(item)
      setFeedback({ tone: "error", message: "Failed to update item. Please try again." })

      return
    }

    setDisplayItem({ ...updatedItem, canEdit: item.canEdit })
  }

  const handleOpenDetails = () => {
    if (isMultiSelectMode || isEditing) return

    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setDetailsLightboxIndex(null)
  }

  const handleOpenEditModal = () => {
    handleCloseDetails()
    clearFeedback()
    setIsEditing(true)
  }

  const feedbackClass = feedback
    ? feedback.tone === "error"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-blue-700 bg-blue-50 border-blue-200"
    : ""

  return (
    <li
      className={`border border-gray-300 rounded p-1${isGridMode ? " aspect-square w-full" : " mb-1"} flex items-center gap-2 relative`}
      onClick={handleOpenDetails}
      onPointerDownCapture={() => {
        if (feedback) clearFeedback()
      }}
      onKeyDownCapture={() => {
        if (feedback) clearFeedback()
      }}
    >
      <div className={`flex-1 min-w-0${isGridMode ? " h-full" : ""}`}>
        {feedback && <p className={`mb-2 rounded border px-2 py-1 text-sm ${feedbackClass}`}>{feedback.message}</p>}
        <ItemCardView viewItem={displayItem} isPriority={isPriority} isGridMode={isGridMode} />
      </div>
      {isGridMode && displayItem.signedUrls.length > 1 && (
        <Images size={20} className="absolute bottom-1 right-1 bg-black/30 rounded p-1 text-white pointer-events-none" />
      )}
      {isMultiSelectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          onClick={e => e.stopPropagation()}
          disabled={displayItem.canEdit === false}
          className="h-4 w-4 shrink-0 accent-blue-500 cursor-pointer disabled:cursor-not-allowed absolute right-0 top-0 -translate-y-1/3 translate-x-1/3"
        />
      )}

      {isDetailsOpen && !isMultiSelectMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onPointerDown={e => {
            if (e.target === e.currentTarget) {
              handleCloseDetails()
            }
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border rounded-xl bg-black p-3 text-white shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between border-b border-gray-700 pb-2">
              <h3 className="text-lg font-semibold">Item Details</h3>
              <div className="flex items-center gap-2">
                {!!displayItem.canEdit && (
                  <button
                    type="button"
                    className="h-8 w-8 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1 flex items-center justify-center"
                    onClick={handleOpenEditModal}
                    title="Edit item"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="px-3 py-1 bg-gray-600 text-white rounded hover-fine:outline-1 active:outline-1"
                  onClick={handleCloseDetails}
                >
                  Close
                </button>
              </div>
            </div>

            {displayItem.signedUrls.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {displayItem.signedUrls.map((signedUrl, imageIndex) => (
                  <button
                    key={`${displayItem.id}-${signedUrl}-${imageIndex}`}
                    type="button"
                    className="relative h-40 rounded cursor-zoom-in focus:outline-2 focus:outline-blue-400"
                    onClick={() => setDetailsLightboxIndex(imageIndex)}
                    aria-label={`View image ${imageIndex + 1} of ${displayItem.signedUrls.length}`}
                  >
                    <Image
                      src={signedUrl}
                      unoptimized
                      alt="Item image"
                      fill
                      priority={Boolean(isPriority && imageIndex === 0)}
                      className="object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-2">
              <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
                <p className="text-xs uppercase tracking-wide text-gray-300">Item Name</p>
                <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{displayItem.itemName}</p>
              </div>

              {detailFields.map(([key, value]) => (
                <div key={key} className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
                  <p className="text-xs uppercase tracking-wide text-gray-300">{key === "listId" ? "List Name" : toReadableLabel(key)}</p>
                  <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">
                    {key === "listId" ? formatFieldValue(displayItem.listName) : formatFieldValue(value, key, usernamesById)}
                  </p>
                </div>
              ))}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
                  <p className="text-xs uppercase tracking-wide text-gray-300">Created At</p>
                  <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">
                    {formatFieldValue(displayItem.createdAt, "createdAt", usernamesById)}
                  </p>
                </div>
                <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
                  <p className="text-xs uppercase tracking-wide text-gray-300">Created By</p>
                  <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{createdByName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
                  <p className="text-xs uppercase tracking-wide text-gray-300">Last Updated At</p>
                  <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">
                    {formatFieldValue(displayItem.lastUpdatedAt, "lastUpdatedAt", usernamesById)}
                  </p>
                </div>
                <div className="rounded border border-gray-600 bg-gray-900 px-2 py-1">
                  <p className="text-xs uppercase tracking-wide text-gray-300">Last Updated By</p>
                  <p className="text-sm text-gray-100 whitespace-pre-wrap break-all">{lastUpdatedByName}</p>
                </div>
              </div>
            </div>

            {detailsLightboxIndex !== null && (
              <ImageLightbox
                urls={displayItem.signedUrls}
                index={detailsLightboxIndex}
                onClose={() => setDetailsLightboxIndex(null)}
                onNavigate={setDetailsLightboxIndex}
              />
            )}
          </div>
        </div>
      )}

      {isEditing && !isMultiSelectMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onPointerDown={e => {
            if (e.target === e.currentTarget) {
              handleCancelEdit()
            }
          }}
        >
          <div className="w-full max-w-xl border rounded-xl bg-black p-3 shadow-lg" onClick={e => e.stopPropagation()}>
            <ItemCardForm item={displayItem} onCancelEdit={handleCancelEdit} onDeleteItem={handleDeleteItem} onSubmit={handleUpdateItem} />
          </div>
        </div>
      )}
    </li>
  )
}

const toReadableLabel = (value: string) => {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, char => char.toUpperCase())
}

const formatFieldValue = (value: unknown, key?: string, usernamesById?: Record<string, string | null>) => {
  if (value === null || value === undefined || value === "") {
    return "-"
  }

  if (key && isUserIdField(key)) {
    return resolveUserLabel(value, usernamesById)
  }

  if (key && isTimestampField(key) && typeof value === "string") {
    return formatTimestamp(value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    return value.map(item => String(item)).join(", ")
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  return String(value)
}

const hasDisplayFieldValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return true
}

const isTimestampField = (key: string) => {
  return key.endsWith("At") || key.endsWith("Date")
}

const isUserIdField = (key: string) => {
  return key === "userId" || key.endsWith("UserId") || key.endsWith("By")
}

const formatTimestamp = (rawValue: string) => {
  const parsed = new Date(rawValue)
  if (Number.isNaN(parsed.getTime())) {
    return rawValue
  }

  const month = parsed.toLocaleString("en-US", { month: "long" })
  const dd = parsed.getDate().toString().padStart(2, "0")
  const yyyy = parsed.getFullYear().toString().padStart(4, "0")
  const hh = parsed.getHours().toString().padStart(2, "0")
  const min = parsed.getMinutes().toString().padStart(2, "0")

  return `${month} ${dd}, ${yyyy} ${hh}:${min}`
}

const collectUserIds = (item: LocalItem): string[] => {
  return Object.entries(item)
    .filter(([key, value]) => isUserIdField(key) && typeof value === "string" && value.length > 0)
    .map(([, value]) => value as string)
}

const resolveUserLabel = (value: unknown, usernamesById?: Record<string, string | null>) => {
  if (typeof value !== "string" || value.length === 0) {
    return "Anon"
  }

  const username = usernamesById?.[value]
  return username && username.trim().length > 0 ? username : "Anon"
}

const revokeBlobUrls = (urls: string[]) => {
  for (const url of urls) {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url)
    }
  }
}
