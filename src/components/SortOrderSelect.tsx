interface SortOrderSelectProps {
  sortAsc: boolean
  onChange: (asc: boolean) => void
}

export const SortOrderSelect = ({ sortAsc, onChange }: SortOrderSelectProps) => {
  return (
    <div className="flex items-center text-sm">
      <select id="sortOrder" className="px-1 py-1 border rounded" value={sortAsc ? "asc" : "desc"} onChange={e => onChange(e.target.value === "asc")}>
        <option value="desc" className="text-black">
          Newest First
        </option>
        <option value="asc" className="text-black">
          Oldest First
        </option>
      </select>
    </div>
  )
}
