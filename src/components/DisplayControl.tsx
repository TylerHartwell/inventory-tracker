import { LayoutGrid, LayoutList } from "lucide-react"

type DisplayMode = "stack" | "grid"
type GridColumns = 1 | 2 | 3 | 4

type DisplayControlProps = {
  displayMode: DisplayMode
  gridColumns: GridColumns
  onDisplayModeChange: (mode: DisplayMode) => void
  onGridColumnsChange: (cols: GridColumns) => void
}

function DisplayControl({ displayMode, gridColumns, onDisplayModeChange, onGridColumnsChange }: DisplayControlProps) {
  return (
    <div className=" rounded flex flex-1 items-center gap-2 text-sm">
      <label className="flex items-center gap-1 pl-2">
        Display
        <span aria-hidden="true" className="text-gray-600">
          {displayMode === "grid" ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
        </span>
        <select
          value={displayMode}
          name="display-mode"
          onChange={e => onDisplayModeChange(e.target.value as DisplayMode)}
          className="h-7 rounded border border-gray-300 bg-black  text-sm text-white"
          title="Display mode"
        >
          <option value="stack" className="bg-black text-white">
            Stack
          </option>
          <option value="grid" className="bg-black text-white">
            Grid
          </option>
        </select>
      </label>
      {displayMode === "grid" && (
        <label className="text-xs text-gray-600 flex items-center gap-1">
          Cols
          <select
            value={gridColumns}
            name="grid-cols"
            onChange={e => onGridColumnsChange(Number(e.target.value) as GridColumns)}
            className="h-7 rounded border border-gray-300 bg-black text-sm text-white"
            title="Grid columns"
          >
            <option value={1} className="bg-black text-white">
              1
            </option>
            <option value={2} className="bg-black text-white">
              2
            </option>
            <option value={3} className="bg-black text-white">
              3
            </option>
            <option value={4} className="bg-black text-white">
              4
            </option>
          </select>
        </label>
      )}
    </div>
  )
}

export default DisplayControl
