import { useEffect, useRef, useState } from "react"
import { Session } from "@supabase/supabase-js"
import { insertList } from "@/utils/list/insertList"

export const ListInput = ({
  session,
  onListCreated,
  onCancel
}: {
  session: Session
  onListCreated: (newListId: string) => void
  onCancel: () => void
}) => {
  const [newList, setNewList] = useState({ listName: "" })
  const [loading, setLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const clear = () => {
    setNewList({ listName: "" })
    onCancel()
  }

  // const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (event.key === "Enter") {
  //     event.preventDefault()
  //     handleSubmit()
  //   }
  // }

  const handleSubmit = async () => {
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
      const { data: newList, error } = await insertList({ listName })
      if (error) {
        return
      }
      clear()
      if (newList) {
        onListCreated(newList.id)
      }
    } catch (err) {
      console.error("Failed to insert list:", err)
      return
    } finally {
      setLoading(false)
    }

    clear()
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        handleSubmit()
      }}
      className="flex justify-between py-0.75 px-1 gap-1"
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="New List Name"
        name="listName"
        value={newList.listName}
        onChange={e => setNewList(prev => ({ ...prev, listName: e.target.value }))}
        className="w-full px-1 border border-gray-300 rounded"
      />

      <div className="flex justify-between gap-1">
        <button
          type="submit"
          disabled={loading || !newList.listName}
          className="px-1 text-sm bg-green-600 text-white rounded 
         hover-fine:outline-1 active:outline-1 
         disabled:bg-gray-700 disabled:text-gray-400 
         disabled:cursor-not-allowed 
         transition-colors w-fit"
        >
          Add
        </button>

        <button
          type="button"
          onClick={clear}
          disabled={loading}
          className="px-1 text-sm bg-gray-600 text-white rounded hover-fine:outline-1 active:outline-1 w-fit"
        >
          Cancel
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
