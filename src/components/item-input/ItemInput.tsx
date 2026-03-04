import { useState } from "react"
import { Session } from "@supabase/supabase-js"
import ImageSelector from "../ImageSelector"
import { insertItem } from "@/utils/item/insertItem"
import { ListSelector } from "./ListSelector"
import { UserLists } from "@/hooks/useUserLists"
import { InsertableItem, LocalItem } from "../ItemManager"

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
  const [itemImage, setItemImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetId, setResetId] = useState(0)
  const selectedList = selectedListId ? userLists.lists.find(list => list.id === selectedListId) : null
  const isViewer = selectedList?.role === "viewer"

  const clear = () => {
    setNewItem({ itemName: "", listId: selectedListId })
    setItemImage(null)
    setResetId(id => id + 1)
  }

  const handleItemImageFile = (file: File | null) => {
    setItemImage(file)
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
      alert("Item Name is required.")
      return
    }

    setLoading(true)

    try {
      const { data: localItem, error } = await insertItem({
        newItem: { ...newItem, listId: selectedListId },
        itemImage
      })
      if (error) {
        console.error("Insert item error:", error)
        setLoading(false)
        alert(`Failed to insert item: ${error || "An error occurred."}`)
        return
      }
      if (!localItem) {
        console.error("Insert item error: No data returned")
        setLoading(false)
        alert("Failed to insert item: No data returned.")
        return
      }
      clear()
      onUpsert(localItem)
    } catch (err) {
      console.error("Unexpected error inserting item:", err)
      alert("Something went wrong while inserting the item.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2 relative border-2">
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
            type="text"
            placeholder="Item Name"
            name="itemName"
            value={newItem.itemName}
            onKeyDown={handleKeyDown}
            onChange={e => setNewItem(prev => ({ ...prev, itemName: e.target.value }))}
            className="w-full p-1 border border-gray-300 rounded"
          />
          <textarea
            placeholder="Extra Details"
            name="extraDetails"
            value={newItem.extraDetails ?? ""}
            onKeyDown={handleKeyDown}
            onChange={e => setNewItem(prev => ({ ...prev, extraDetails: e.target.value }))}
            className="w-full p-1 border border-gray-300 rounded min-h-min"
          />

          <ImageSelector onImageFileChange={handleItemImageFile} key={resetId} />

          <div className="flex justify-between">
            <button
              type="button"
              onClick={clear}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover-fine:outline-1 active:outline-1 w-fit cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="relative px-4 py-2 bg-green-600 text-white rounded hover-fine:outline-1 active:outline-1 w-fit cursor-pointer"
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
    </div>
  )
}
