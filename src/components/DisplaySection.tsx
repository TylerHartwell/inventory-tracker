import ContainImageFitToggle from "./ContainImageFitToggle"
import LayoutControl from "./LayoutControl"
import { SortField, SortOrderSelect } from "./SortOrderSelect"

type LayoutMode = "stack" | "grid"
type GridColumns = 1 | 2 | 3 | 4

export type ImageDisplayMode = "show" | "hide" | "only"

type DisplaySectionProps = {
  sortField: SortField
  sortAsc: boolean
  onSortChange: (field: SortField, asc: boolean) => void
  layoutMode: LayoutMode
  gridColumns: GridColumns
  imageDisplayMode: ImageDisplayMode
  useContainImageFit: boolean
  onLayoutModeChange: (mode: LayoutMode) => void
  onGridColumnsChange: (cols: GridColumns) => void
  onImageDisplayModeChange: (value: ImageDisplayMode) => void
  onUseContainImageFitChange: (value: boolean) => void
}

function DisplaySection({
  sortField,
  sortAsc,
  onSortChange,
  layoutMode,
  gridColumns,
  imageDisplayMode,
  useContainImageFit,
  onLayoutModeChange,
  onGridColumnsChange,
  onImageDisplayModeChange,
  onUseContainImageFitChange
}: DisplaySectionProps) {
  return (
    <section className="rounded border border-gray-700 p-2 flex flex-col gap-2">
      <div className="flex items-center justify-start gap-3 flex-wrap min-w-0">
        <h2 className="text-sm font-medium border-b border-r rounded border-gray-600 w-min pr-2 pb-1">Display</h2>
        <LayoutControl
          layoutMode={layoutMode}
          gridColumns={gridColumns}
          onLayoutModeChange={onLayoutModeChange}
          onGridColumnsChange={onGridColumnsChange}
        />
        <label className="flex items-center gap-1 text-xs text-gray-300">
          Images
          <select
            value={imageDisplayMode}
            name="item-image-display"
            onChange={e => onImageDisplayModeChange(e.target.value as ImageDisplayMode)}
            className="h-7 rounded border border-gray-300 bg-black text-sm text-white"
            title="Item image display"
          >
            <option value="show" className="bg-black text-white">
              Show
            </option>
            <option value="hide" className="bg-black text-white">
              Hide
            </option>
            <option value="only" className="bg-black text-white">
              Only
            </option>
          </select>
        </label>
        <ContainImageFitToggle
          id="use-contain-image-fit"
          useContainImageFit={useContainImageFit}
          onUseContainImageFitChange={onUseContainImageFitChange}
          className="ml-auto pr-2"
        />
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <SortOrderSelect sortField={sortField} sortAsc={sortAsc} onChange={onSortChange} />
      </div>
    </section>
  )
}

export default DisplaySection
