import { useState } from "react"
import { Session } from "@supabase/supabase-js"
import ImageSelector from "./ImageSelector"
import { insertItem } from "@/utils/insertItem"
import { ListSelector } from "./ListSelector"
import { UserLists } from "@/hooks/useUserLists"

export const ItemInput = ({
  session,
  refresh,
  selectedListId,
  onItemInputListChange,
  userLists
}: {
  session: Session
  refresh: () => Promise<void>
  selectedListId: string | null
  onItemInputListChange: (listId: string | null) => void
  userLists: UserLists
}) => {
  const [newItem, setNewItem] = useState({ itemName: "", extraDetails: "" })
  const [itemImage, setItemImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetId, setResetId] = useState(0)

  const clear = () => {
    setNewItem({ itemName: "", extraDetails: "" })
    setItemImage(null)
    setResetId(id => id + 1)
  }

  const handleLocalImage = (file: File | null) => {
    setItemImage(file)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!session.user) {
      console.error("Not authenticated")
      return
    }

    const { itemName, extraDetails } = newItem

    if (!itemName.trim()) {
      alert("Item Name is required.")
      return
    }

    setLoading(true)

    try {
      const { error } = await insertItem({ session, itemName, extraDetails, itemImage, selectedListId })
      if (error) {
        console.error("Insert item error:", error)
        setLoading(false)
        alert(`Failed to insert item: ${error || "An error occurred."}`)
        return
      }
      clear()
      // await refresh()
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
        refresh={refresh}
      />
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
        value={newItem.extraDetails}
        onChange={e => setNewItem(prev => ({ ...prev, extraDetails: e.target.value }))}
        className="w-full p-1 border border-gray-300 rounded min-h-min"
      />

      <ImageSelector handleLocalImage={handleLocalImage} key={resetId} />

      <div className="flex justify-between">
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
        <button
          type="button"
          onClick={clear}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover-fine:outline-1 active:outline-1 w-fit cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
