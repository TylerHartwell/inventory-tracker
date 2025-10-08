import { useUserLists } from "@/hooks/useUserLists"
import { Session } from "@supabase/supabase-js"
import { useState } from "react"
import { ListInput } from "./ListInput"

interface ListSelectorProps {
  value: string | null
  onChange: (listId: string | null) => void
  label?: string
  session: Session
}

export function ListSelector({ value, onChange, label = "Select List", session }: ListSelectorProps) {
  const { lists, loading, error } = useUserLists(session.user.id)
  const [creatingNew, setCreatingNew] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    if (selectedValue === "new") {
      setCreatingNew(true)
      onChange("new")
    } else {
      setCreatingNew(false)
      onChange(selectedValue === "" ? null : selectedValue)
    }
  }

  const handleListCreated = async (newListId: string) => {
    /////////////// reload lists?
    onChange(newListId)
    setCreatingNew(false)
  }

  return (
    <div className="mb-4">
      {label && <div className="block font-medium mb-2">{label}</div>}

      {loading ? (
        <div className="text-gray-500">Loading lists...</div>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : (
        <>
          <select
            value={value ?? ""}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring focus:ring-blue-100 focus:border-blue-400"
          >
            <option value="" className="bg-gray-100 text-gray-700">
              No List
            </option>
            {lists.map(list => (
              <option key={list.id} value={list.id} className="bg-white text-gray-800 hover:bg-blue-50">
                {list.name}
              </option>
            ))}
            <option value="new" className="font-semibold text-blue-700">
              ➕ Create New List
            </option>
          </select>
          {creatingNew && session && (
            <div className="mt-3 border border-gray-300 rounded-lg p-2">
              <ListInput session={session} onListCreated={handleListCreated} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
