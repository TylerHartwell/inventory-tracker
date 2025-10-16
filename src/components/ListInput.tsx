import { FormEvent, useState } from "react"
import { Session } from "@supabase/supabase-js"
import { insertList } from "@/utils/insertList"

export const ListInput = ({ session, onListCreated }: { session: Session; onListCreated?: (newListId: string, name: string) => void }) => {
  const [newList, setNewList] = useState({ listName: "" })
  const [loading, setLoading] = useState(false)

  const clearForm = () => {
    setNewList({ listName: "" })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!session.user) {
      console.error("Not authenticated")
      return
    }

    const { listName } = newList

    if (!listName.trim()) {
      alert("List name is required.")
      return
    }

    setLoading(true)

    try {
      const { data: newList, error } = await insertList({ session, listName })
      if (error) {
        return
      }
      clearForm()
      if (newList) {
        onListCreated?.(newList.id, newList.name)
      }
    } catch (err) {
      console.error("Failed to insert list:", err)
      return
    } finally {
      setLoading(false)
    }

    clearForm()
  }

  return (
    <div className="flex flex-col gap-2 p-2 relative border-2">
      <input
        type="text"
        placeholder="List Name"
        name="listName"
        value={newList.listName}
        onChange={e => setNewList(prev => ({ ...prev, listName: e.target.value }))}
        className="w-full p-2 border border-gray-300 rounded"
      />

      {newList.listName && (
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-blue-700 w-fit"
          >
            Add List
          </button>
          <button type="button" onClick={clearForm} disabled={loading} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-blue-700 w-fit">
            Clear
          </button>
        </div>
      )}

      {loading && (
        <div className="absolute flex items-center justify-center bottom-3 left-1/2 -translate-x-1/2">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}
