import { useState, useEffect, useRef } from "react"
import { Session } from "@supabase/supabase-js"
import ImageSelector from "../ImageSelector"
import { insertItem } from "@/utils/item/insertItem"
import { ListSelector } from "./ListSelector"
import { UserLists } from "@/hooks/useUserLists"
import { InsertableItem, LocalItem } from "../ItemManager"
import { useToast } from "@/hooks/useToast"
import { Eye, EyeOff, Plus } from "lucide-react"

type Feedback = { type: "error" | "success"; message: string }

export const ItemInput = ({
  session,
  refreshItems,
  selectedListId,
  onItemInputListChange,
  userLists,
  onUpsert
}: {
  session: Session
  refreshItems: () => Promise<void>
  selectedListId: string | null
  onItemInputListChange: (listId: string | null) => void
  userLists: UserLists
  onUpsert: (item: LocalItem) => void
}) => {
  const [newItem, setNewItem] = useState<InsertableItem>({ itemName: "", listId: selectedListId })
  const [itemImages, setItemImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [resetId, setResetId] = useState(0)
  const {
    toast: feedback,
    setToast: setFeedback,
    isVisible: feedbackVisible,
    isFadingIn,
    isFadingOut,
    fadeInDuration,
    fadeOutDuration
  } = useToast<Feedback>({
    shouldFadeOut: fb => fb.type === "success"
  })
  const selectedList = selectedListId ? userLists.lists.find(list => list.id === selectedListId) : null
  const isViewer = selectedList?.role === "viewer"
  const itemNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isExpanded && !isViewer) {
      itemNameRef.current?.focus()
    }
  }, [isExpanded, isViewer])

  const resetForm = () => {
    setNewItem({ itemName: "", listId: selectedListId })
    setItemImages([])
    setResetId(id => id + 1)
  }

  const clear = () => {
    resetForm()
    setFeedback(null)
  }

  const handleItemImageFile = (files: File[]) => {
    setItemImages(files)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (isViewer) {
      return
    }

    if (!session.user) {
      console.error("Not authenticated")
      return
    }

    if (!newItem.itemName.trim()) {
      setFeedback({ type: "error", message: "Item Name is required." })
      return
    }

    setLoading(true)

    try {
      const { data: localItem, error } = await insertItem({
        newItem: { ...newItem, listId: selectedListId },
        itemImages
      })
      if (error) {
        console.error("Insert item error:", error)
        setLoading(false)
        setFeedback({ type: "error", message: `Failed to insert item: ${error || "An error occurred."}` })
        return
      }
      if (!localItem) {
        console.error("Insert item error: No data returned")
        setLoading(false)
        setFeedback({ type: "error", message: "Failed to insert item: No data returned." })
        return
      }
      resetForm()
      onUpsert(localItem)
      setFeedback({ type: "success", message: "Item added." })
    } catch (err) {
      console.error("Unexpected error inserting item:", err)
      setFeedback({ type: "error", message: "Something went wrong while inserting the item." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex flex-col gap-2 p-1 relative ${isExpanded ? "border-2" : "border border-gray-700"}`}>
      <div
        className="relative flex items-center justify-end cursor-pointer"
        onClick={() => setIsExpanded(prev => !prev)}
        title={isExpanded ? "Collapse item input" : "Expand item input"}
      >
        <h2 className="absolute left-1/2 -translate-x-1/2 text-md flex items-center gap-1">Item Input {!isExpanded && <Plus size={16} />}</h2>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            setIsExpanded(prev => !prev)
          }}
          className="p-1 bg-gray-700 text-white rounded hover-fine:outline-1 active:outline-1 w-fit cursor-pointer"
          title={isExpanded ? "Collapse item input" : "Expand item input"}
        >
          {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <ListSelector
            selectedListId={selectedListId}
            onItemInputListChange={onItemInputListChange}
            session={session}
            userLists={userLists}
            refreshItems={refreshItems}
          />
          {!isViewer && (
            <>
              <input
                ref={itemNameRef}
                type="text"
                placeholder="Item Name"
                name="itemName"
                value={newItem.itemName}
                onKeyDown={handleKeyDown}
                onChange={e => {
                  setFeedback(null)
                  setNewItem(prev => ({ ...prev, itemName: e.target.value }))
                }}
                className="w-full p-1 border border-gray-400 rounded"
              />
              <textarea
                placeholder="Extra Details"
                name="extraDetails"
                value={newItem.extraDetails ?? ""}
                onKeyDown={handleKeyDown}
                onChange={e => {
                  setFeedback(null)
                  setNewItem(prev => ({ ...prev, extraDetails: e.target.value }))
                }}
                className="w-full p-1 border border-gray-400 rounded min-h-min"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Category"
                  name="category"
                  value={newItem.category ?? ""}
                  onKeyDown={handleKeyDown}
                  onChange={e => {
                    setFeedback(null)
                    setNewItem(prev => ({ ...prev, category: e.target.value }))
                  }}
                  className="w-full p-1 border border-gray-400 rounded"
                />
                <input
                  type="date"
                  name="expirationDate"
                  value={newItem.expirationDate ?? ""}
                  onChange={e => {
                    setFeedback(null)
                    setNewItem(prev => ({ ...prev, expirationDate: e.target.value || null }))
                  }}
                  className={`w-full p-1 border border-gray-400 rounded scheme-dark ${newItem.expirationDate ? "text-white" : "text-gray-400"}`}
                  title="Expiration date"
                />
              </div>

              <ImageSelector onImageFileChange={handleItemImageFile} key={resetId} onFileInputClick={() => setFeedback(null)} />

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={clear}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover-fine:outline-1 active:outline-1 w-fit cursor-pointer"
                  title="Clear input"
                >
                  Clear
                </button>
                {feedback && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`text-sm ${isFadingIn || isFadingOut ? "transition-opacity" : ""} ${
                      isFadingIn ? "ease-in" : isFadingOut ? "ease-out" : ""
                    } ${
                      feedbackVisible && !isFadingIn && !isFadingOut ? "opacity-100" : "opacity-0"
                    } ${feedback.type === "error" ? "text-red-700" : "text-green-700"}`}
                    style={isFadingIn || isFadingOut ? { transitionDuration: `${isFadingIn ? fadeInDuration : fadeOutDuration}ms` } : undefined}
                  >
                    {feedback.message}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="relative px-4 py-2 bg-green-600 text-white rounded hover-fine:outline-1 active:outline-1 w-fit cursor-pointer"
                  title="Add item"
                >
                  {/* Button label */}
                  <span className={loading ? "opacity-30" : ""}>Add Item</span>

                  {/* Loading overlay */}
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
