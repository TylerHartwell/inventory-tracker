import { useUserLists } from "@/hooks/useUserLists"

interface ListSelectProps {
  userId: string
  value: (string | null)[]
  onChange: (lists: (string | null)[]) => void
}

export function ListSelect({ userId, value, onChange }: ListSelectProps) {
  const { lists, loading, error } = useUserLists(userId)

  const handleToggle = (id: string | null) => {
    if (value.includes(id)) {
      if (id === null && value.filter(v => v !== null).length === 0) {
        // prevent unchecking Default if no other lists are selected
        return
      }
      onChange(value.filter(v => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  const handleSelectAll = () => {
    const allIds = [null, ...lists.map(l => l.id)]
    const allSelected = allIds.every(id => value.includes(id))

    onChange(allSelected ? [] : allIds)
  }

  return (
    <div className="mb-4">
      <div className="block font-medium mb-2">Filter by Lists</div>

      {loading ? (
        <div className="text-gray-500">Loading lists...</div>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="default" checked={value.includes(null)} onChange={() => handleToggle(null)} />
            <span>Default</span>
          </label>

          {lists.map(list => (
            <label key={list.id} className="flex items-center gap-2">
              <input type="checkbox" name={list.id} checked={value.includes(list.id)} onChange={() => handleToggle(list.id)} />
              <span>{list.name}</span>
            </label>
          ))}

          <button
            type="button"
            onClick={handleSelectAll}
            className="mt-2 self-start border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-100"
          >
            {(() => {
              const allIds = [null, ...lists.map(l => l.id)]
              const allSelected = allIds.length > 0 && allIds.every(id => value.includes(id))
              return allSelected ? "Clear All" : "Select All"
            })()}
          </button>
        </div>
      )}
    </div>
  )
}
