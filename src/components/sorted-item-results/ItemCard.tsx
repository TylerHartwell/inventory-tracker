import { Images } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import useDeepCompare from "@/hooks/useDeepCompare"
import { Item, LocalItem } from "../ItemManager"
import { ImageDisplayMode } from "../DisplaySection"
import { deleteItem } from "@/utils/item/deleteItem"
import { updateItem } from "@/utils/item/updateItem"
import ItemCardView from "./ItemCardView"
import ItemCardDetailsModal from "./ItemCardDetailsModal"
import ItemCardEditModal from "./ItemCardEditModal"
import { supabase } from "@/supabase-client"
import { generateSignedUrls } from "@/utils/generateSignedUrl"

interface ItemCardProps {
  item: LocalItem
  isPriority: boolean
  onDelete: (id: string) => void
  isMultiSelectMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
  isDetailsOpen: boolean
  hasPreviousItem: boolean
  hasNextItem: boolean
  onOpenDetails: () => void
  onCloseDetails: () => void
  onOpenPreviousDetails: () => void
  onOpenNextDetails: () => void
  isGridMode?: boolean
  imageDisplayMode: ImageDisplayMode
  useContainImageFit: boolean
  onUseContainImageFitChange: (value: boolean) => void
  showUnsetItemFields: boolean
  onShowUnsetItemFieldsChange: (value: boolean) => void
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

const usernamesCache = new Map<string, string | null>()
const pendingUsernameLoads = new Map<string, Promise<void>>()

export const ItemCard = ({
  item,
  isPriority,
  onDelete,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
  isDetailsOpen,
  hasPreviousItem,
  hasNextItem,
  onOpenDetails,
  onCloseDetails,
  onOpenPreviousDetails,
  onOpenNextDetails,
  isGridMode = false,
  imageDisplayMode,
  useContainImageFit,
  onUseContainImageFitChange,
  showUnsetItemFields,
  onShowUnsetItemFieldsChange
}: ItemCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [displayItem, setDisplayItem] = useState(item)
  const [usernamesById, setUsernamesById] = useState<Record<string, string | null>>({})
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const clearFeedback = () => setFeedback(null)

  useEffect(() => {
    setDisplayItem(item)
  }, [item])

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

  const detailDisplayFields = useMemo(() => {
    return detailFields.map(([key, value]) => ({
      key,
      label: key === "listId" ? "List Name" : toReadableLabel(key),
      value: key === "listId" ? formatFieldValue(displayItem.listName) : formatFieldValue(value, key, usernamesById)
    }))
  }, [detailFields, displayItem.listName, usernamesById])

  const createdAtDisplay = useMemo(() => {
    return formatFieldValue(displayItem.createdAt, "createdAt", usernamesById)
  }, [displayItem.createdAt, usernamesById])

  const lastUpdatedAtDisplay = useMemo(() => {
    return formatFieldValue(displayItem.lastUpdatedAt, "lastUpdatedAt", usernamesById)
  }, [displayItem.lastUpdatedAt, usernamesById])

  const userIds = useDeepCompare(useMemo(() => [...new Set(collectUserIds(displayItem))], [displayItem]))

  useEffect(() => {
    if (userIds.length === 0) {
      return
    }

    let cancelled = false

    const mapFromCache = () => {
      const nextMap: Record<string, string | null> = {}
      for (const id of userIds) {
        if (usernamesCache.has(id)) {
          nextMap[id] = usernamesCache.get(id) ?? null
        }
      }
      return nextMap
    }

    const loadUsernames = async () => {
      setUsernamesById(mapFromCache())

      const missingIds = userIds.filter(id => !usernamesCache.has(id))

      if (missingIds.length === 0) {
        return
      }

      const idsToFetch = missingIds.filter(id => !pendingUsernameLoads.has(id))

      if (idsToFetch.length > 0) {
        const requestPromise = (async () => {
          const { data, error } = await supabase.from("profiles").select("id, username").in("id", idsToFetch)

          if (error || !data) {
            console.error("Failed to load usernames for item details:", error)
            return
          }

          const foundIds = new Set<string>()

          for (const profile of data) {
            usernamesCache.set(profile.id, profile.username)
            foundIds.add(profile.id)
          }

          for (const id of idsToFetch) {
            if (!foundIds.has(id)) {
              usernamesCache.set(id, null)
            }
          }
        })()

        for (const id of idsToFetch) {
          pendingUsernameLoads.set(id, requestPromise)
        }

        requestPromise.finally(() => {
          for (const id of idsToFetch) {
            pendingUsernameLoads.delete(id)
          }
        })
      }

      await Promise.all(missingIds.map(id => pendingUsernameLoads.get(id)))

      if (cancelled) {
        return
      }

      setUsernamesById(mapFromCache())
    }

    loadUsernames()

    return () => {
      cancelled = true
    }
  }, [userIds])

  useEffect(() => {
    if (!isDetailsOpen && !isEditing) {
      return
    }

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDetailsOpen, isEditing])

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
    onCloseDetails()

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

  const handleOpenDetails = async () => {
    if (isEditing) return

    if (displayItem.imageUrls.length > 0) {
      const refreshedSignedUrls = await generateSignedUrls(displayItem.imageUrls)

      setDisplayItem(prev => ({
        ...prev,
        signedUrls: refreshedSignedUrls
      }))
    }

    onOpenDetails()
  }

  const handleOpenEditModal = () => {
    onCloseDetails()
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
      className={`border border-gray-300 rounded p-1${isGridMode ? " aspect-square w-full" : " mb-1"} flex items-center gap-2 relative cursor-pointer`}
      onClick={handleOpenDetails}
      onPointerDownCapture={() => {
        if (feedback) clearFeedback()
      }}
      onKeyDownCapture={() => {
        if (feedback) clearFeedback()
      }}
      title="View item details"
    >
      <div className={`flex-1 min-w-0${isGridMode ? " h-full" : ""}`}>
        {feedback && <p className={`mb-2 rounded border px-2 py-1 text-sm ${feedbackClass}`}>{feedback.message}</p>}
        <ItemCardView
          viewItem={displayItem}
          isPriority={isPriority}
          isGridMode={isGridMode}
          imageDisplayMode={imageDisplayMode}
          useContainImageFit={useContainImageFit}
        />
      </div>
      {isGridMode && imageDisplayMode !== "hide" && displayItem.signedUrls.length > 1 && (
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
          title={isSelected ? "Deselect item" : "Select item"}
        />
      )}

      {isDetailsOpen && (
        <ItemCardDetailsModal
          displayItem={displayItem}
          isPriority={isPriority}
          detailDisplayFields={detailDisplayFields}
          createdAtDisplay={createdAtDisplay}
          createdByName={createdByName}
          lastUpdatedAtDisplay={lastUpdatedAtDisplay}
          lastUpdatedByName={lastUpdatedByName}
          hasPreviousItem={hasPreviousItem}
          hasNextItem={hasNextItem}
          onPreviousItem={onOpenPreviousDetails}
          onNextItem={onOpenNextDetails}
          onClose={onCloseDetails}
          onOpenEdit={handleOpenEditModal}
          useContainImageFit={useContainImageFit}
          onUseContainImageFitChange={onUseContainImageFitChange}
        />
      )}

      {isEditing && (
        <ItemCardEditModal
          item={displayItem}
          onCancelEdit={handleCancelEdit}
          onDeleteItem={handleDeleteItem}
          onSubmit={handleUpdateItem}
          showUnsetFields={showUnsetItemFields}
          onShowUnsetFieldsChange={onShowUnsetItemFieldsChange}
        />
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

  if (key && isDateOnlyField(key) && typeof value === "string") {
    return formatDateOnly(value)
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

const isDateOnlyField = (key: string) => {
  return key.endsWith("Date")
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

const formatDateOnly = (rawValue: string) => {
  const parsed = new Date(rawValue)
  if (Number.isNaN(parsed.getTime())) {
    return rawValue
  }

  const month = parsed.toLocaleString("en-US", { month: "long" })
  const dd = parsed.getDate().toString().padStart(2, "0")
  const yyyy = parsed.getFullYear().toString().padStart(4, "0")

  return `${month} ${dd}, ${yyyy}`
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
