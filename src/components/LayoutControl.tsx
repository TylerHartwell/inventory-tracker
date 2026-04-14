import { LayoutGrid, LayoutList } from "lucide-react"
import ContainImageFitToggle from "./ContainImageFitToggle"

type LayoutMode = "stack" | "grid"
type GridColumns = 1 | 2 | 3 | 4

type LayoutControlProps = {
  layoutMode: LayoutMode
  gridColumns: GridColumns
  useContainImageFit: boolean
  onLayoutModeChange: (mode: LayoutMode) => void
  onGridColumnsChange: (cols: GridColumns) => void
  onUseContainImageFitChange: (value: boolean) => void
}

function LayoutControl({
  layoutMode,
  gridColumns,
  useContainImageFit,
  onLayoutModeChange,
  onGridColumnsChange,
  onUseContainImageFitChange
}: LayoutControlProps) {
  return (
    <>
      <div className=" rounded flex items-center gap-2 text-sm flex-1">
        <label className="flex items-center gap-1 pl-2">
          Layout
          <span aria-hidden="true" className="text-gray-600">
            {layoutMode === "grid" ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
          </span>
          <select
            value={layoutMode}
            name="layout-mode"
            onChange={e => onLayoutModeChange(e.target.value as LayoutMode)}
            className="h-7 rounded border border-gray-300 bg-black  text-sm text-white"
            title="Layout mode"
          >
            <option value="stack" className="bg-black text-white">
              Stack
            </option>
            <option value="grid" className="bg-black text-white">
              Grid
            </option>
          </select>
        </label>
        {layoutMode === "grid" && (
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
      <ContainImageFitToggle
        id="use-contain-image-fit"
        useContainImageFit={useContainImageFit}
        onUseContainImageFitChange={onUseContainImageFitChange}
        className="ml-auto pr-2"
      />
    </>
  )
}

export default LayoutControl
