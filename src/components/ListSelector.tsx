import { useUserLists } from "@/hooks/useUserLists"
import { Session } from "@supabase/supabase-js"
import { useState } from "react"
import { ListInput } from "./ListInput"

interface ListSelectorProps {
  value: string | null
  onChange: (listId: string | null) => void
  session: Session
}

export function ListSelector({ value, onChange, session }: ListSelectorProps) {
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
    onChange(newListId)
    setCreatingNew(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="list" className="font-medium whitespace-nowrap">
          List:
        </label>
        {loading ? (
          <div className="text-gray-500">Loading lists...</div>
        ) : error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : (
          <select
            value={value ?? ""}
            name="list"
            id="list"
            onChange={handleChange}
            className="border border-gray-300 text-white rounded px-1 py-1 text-sm flex-1 focus:ring focus:ring-blue-100 focus:border-blue-400"
          >
            <option value="" className="bg-black">
              Personal (Default)
            </option>
            {lists.map(list => (
              <option key={list.id} value={list.id} className="bg-black hover:bg-blue-50">
                {list.name}
              </option>
            ))}
            <option value="new" className="bg-black font-semibold ">
              + Create New List
            </option>
          </select>
        )}
      </div>

      {creatingNew && <ListInput session={session} onListCreated={handleListCreated} />}
    </div>
  )
}
