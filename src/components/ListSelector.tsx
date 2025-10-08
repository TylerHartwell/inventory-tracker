import { useUserLists } from "@/hooks/useUserLists"

interface ListSelectorProps {
  userId: string
  value: string | null
  onChange: (listId: string | null) => void
  label?: string
}

export function ListSelector({ userId, value, onChange, label = "Select List" }: ListSelectorProps) {
  const { lists, loading, error } = useUserLists(userId)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    onChange(selectedValue === "" ? null : selectedValue)
  }

  return (
    <div className="mb-4">
      {label && <div className="block font-medium mb-2">{label}</div>}

      {loading ? (
        <div className="text-gray-500">Loading lists...</div>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : (
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
        </select>
      )}
    </div>
  )
}
