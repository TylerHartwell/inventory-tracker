interface SortOrderSelectProps {
  sortAsc: boolean
  onChange: (asc: boolean) => void
}

export const SortOrderSelect = ({ sortAsc, onChange }: SortOrderSelectProps) => {
  return (
    <div className="mb-4 self-center">
      <label htmlFor="sortOrder" className="mr-2 font-medium text-sm">
        Order by Date:
      </label>
      <select
        id="sortOrder"
        className="px-2 py-1 border rounded text-sm"
        value={sortAsc ? "asc" : "desc"}
        onChange={e => onChange(e.target.value === "asc")}
      >
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
