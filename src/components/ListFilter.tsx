import { UserLists } from "@/hooks/useUserLists"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface ListFilterProps {
  filteredLists: (string | null)[]
  onChange: (lists: (string | null)[]) => void
  selectedList: string | null
  userLists: UserLists
}

export function ListFilter({ filteredLists, onChange, selectedList, userLists }: ListFilterProps) {
  const [expanded, setExpanded] = useState(false)

  const { lists, loading, error } = userLists

  const handleToggle = (id: string | null) => {
    const isSelected = filteredLists.includes(id)

    const nextLists = isSelected ? filteredLists.filter(v => v !== id) : [...filteredLists, id]

    onChange(nextLists.length === 0 ? [null] : nextLists)
  }

  const handleFilterAll = () => {
    const allIds = [null, ...lists.map(l => l.id)]
    const allFiltered = allIds.every(id => filteredLists.includes(id))

    onChange(allFiltered ? [null] : allIds)
  }

  return (
    <div className="border border-gray-200 rounded-lg flex-1 text-sm">
      {/* Header */}
      <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full px-1 py-1">
        <span className="font-medium ml-2">{expanded ? "Showing Lists:" : "Filter"}</span>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {/* Collapsible Content (no animation) */}
      {expanded && (
        <div className="px-3 pb-3">
          {loading ? (
            <div className="text-gray-500 mt-2">Loading lists...</div>
          ) : error ? (
            <div className="text-red-600 mt-2">Error: {error}</div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="default" checked={filteredLists.includes(null)} onChange={() => handleToggle(null)} />
                <span className={null === selectedList ? "font-semibold underline" : ""}>Personal (Default)</span>
              </label>

              {lists.map(list => (
                <label key={list.id} className="flex items-center gap-2">
                  <input type="checkbox" name={list.id} checked={filteredLists.includes(list.id)} onChange={() => handleToggle(list.id)} />
                  <span className={list.id === selectedList ? "font-semibold underline" : ""}>{list.name}</span>
                </label>
              ))}

              <button
                type="button"
                onClick={handleFilterAll}
                className="self-start border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-100"
              >
                {(() => {
                  const allIds = [null, ...lists.map(l => l.id)]
                  const allFiltered = allIds.length > 0 && allIds.every(id => filteredLists.includes(id))
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
