import { FormEvent, useState } from "react"
import { Session } from "@supabase/supabase-js"
import ImageSelector from "./ImageSelector"
import { insertItem } from "@/utils/insertItem"

export const ItemInput = ({ session, refresh, selectedList }: { session: Session; refresh: () => Promise<void>; selectedList: string | null }) => {
  const [newItem, setNewItem] = useState({ itemName: "", extraDetails: "" })
  const [itemImage, setItemImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetId, setResetId] = useState(0)

  const clearForm = () => {
    setNewItem({ itemName: "", extraDetails: "" })
    setItemImage(null)
    setResetId(id => id + 1)
  }

  const handleLocalImage = (file: File | null) => {
    setItemImage(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

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
      await insertItem({ session, itemName, extraDetails, itemImage, selectedList })
      await refresh()
    } catch (err) {
      console.error("Failed to insert item:", err)
      return
    } finally {
      setLoading(false)
    }

    clearForm()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 p-2 relative border-2">
      <input
        type="text"
        placeholder="Item Name"
        name="itemName"
        value={newItem.itemName}
        onChange={e => setNewItem(prev => ({ ...prev, itemName: e.target.value }))}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <textarea
        placeholder="Extra Details"
        name="extraDetails"
        value={newItem.extraDetails}
        onChange={e => setNewItem(prev => ({ ...prev, extraDetails: e.target.value }))}
        className="w-full p-2 border border-gray-300 rounded min-h-min"
      />

      <ImageSelector handleLocalImage={handleLocalImage} key={resetId} />

      <div className="flex justify-between">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-blue-700 w-fit">
          Add Item
        </button>
        <button type="button" onClick={clearForm} disabled={loading} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-blue-700 w-fit">
          Clear Form
        </button>
      </div>

      {loading && (
        <div className="absolute flex items-center justify-center bottom-3 left-1/2 -translate-x-1/2">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </form>
  )
}
