import { useUserLists } from "@/hooks/useUserLists"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

interface ListFilterProps {
  userId: string
  value: (string | null)[]
  onChange: (lists: (string | null)[]) => void
}

export function ListFilter({ userId, value, onChange }: ListFilterProps) {
  const { lists, loading, error } = useUserLists(userId)
  const [expanded, setExpanded] = useState(false)

  const handleToggle = (id: string | null) => {
    if (value.includes(id)) {
      if (id === null && value.filter(v => v !== null).length === 0) {
        // prevent unchecking Default if no other lists are filtered
        return
      }
      onChange(value.filter(v => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  const handleFilterAll = () => {
    const allIds = [null, ...lists.map(l => l.id)]
    const allFiltered = allIds.every(id => value.includes(id))

    onChange(allFiltered ? [] : allIds)
  }

  return (
    <div className="mb-4 border border-gray-200 rounded-lg">
      {/* Header */}
      <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full px-3 py-2  rounded-t-lg">
        <span className="font-medium ">Filter by Lists</span>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>

      {/* Collapsible Content (no animation) */}
      {expanded && (
        <div className="px-3 pb-3">
          {loading ? (
            <div className="text-gray-500 mt-2">Loading lists...</div>
          ) : error ? (
            <div className="text-red-600 mt-2">Error: {error}</div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={value.includes(null)} onChange={() => handleToggle(null)} />
                <span>Default</span>
              </label>

              {lists.map(list => (
                <label key={list.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={value.includes(list.id)} onChange={() => handleToggle(list.id)} />
                  <span>{list.name}</span>
                </label>
              ))}

              <button
                type="button"
                onClick={handleFilterAll}
                className="mt-2 self-start border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-100"
              >
                {(() => {
                  const allIds = [null, ...lists.map(l => l.id)]
                  const allFiltered = allIds.length > 0 && allIds.every(id => value.includes(id))
                  return allFiltered ? "Clear All" : "Include All"
                })()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
