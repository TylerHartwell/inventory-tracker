import ContainImageFitToggle from "./ContainImageFitToggle"
import LayoutControl from "./LayoutControl"
import { SortField, SortOrderSelect } from "./SortOrderSelect"

type LayoutMode = "stack" | "grid" | "gallery"
type GridColumns = 1 | 2 | 3 | 4

export type VisibilityMode = "default" | "hide-images" | "hide-info"

type DisplaySectionProps = {
  sortField: SortField
  sortAsc: boolean
  onSortChange: (field: SortField, asc: boolean) => void
  layoutMode: LayoutMode
  gridColumns: GridColumns
  galleryColumns: GridColumns
  visibilityMode: VisibilityMode
  showFilterToImagesOnlyAction: boolean
  useContainImageFit: boolean
  onLayoutModeChange: (mode: LayoutMode) => void
  onGridColumnsChange: (cols: GridColumns) => void
  onGalleryColumnsChange: (cols: GridColumns) => void
  onVisibilityModeChange: (value: VisibilityMode) => void
  onFilterToImagesOnly: () => void
  onUseContainImageFitChange: (value: boolean) => void
}

function DisplaySection({
  sortField,
  sortAsc,
  onSortChange,
  layoutMode,
  gridColumns,
  galleryColumns,
  visibilityMode,
  showFilterToImagesOnlyAction,
  useContainImageFit,
  onLayoutModeChange,
  onGridColumnsChange,
  onGalleryColumnsChange,
  onVisibilityModeChange,
  onFilterToImagesOnly,
  onUseContainImageFitChange
}: DisplaySectionProps) {
  return (
    <section className="rounded border border-gray-700 p-2 flex flex-col gap-2">
      <div className="flex items-center justify-start gap-3 flex-wrap min-w-0">
        <h2 className="text-sm font-medium border-b border-r rounded border-gray-600 w-min pr-2 pb-1">Display</h2>

        <LayoutControl
          layoutMode={layoutMode}
          gridColumns={gridColumns}
          galleryColumns={galleryColumns}
          onLayoutModeChange={onLayoutModeChange}
          onGridColumnsChange={onGridColumnsChange}
          onGalleryColumnsChange={onGalleryColumnsChange}
        />
        <div className="flex-1">
          {layoutMode === "gallery" && showFilterToImagesOnlyAction && (
            <button
              type="button"
              onClick={onFilterToImagesOnly}
              className="h-7 rounded border border-gray-500 px-2 text-xs text-white hover-fine:border-gray-300 active:border-gray-300 text-nowrap"
              title="Apply image-present filter"
            >
              + Image Presence Filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-300 ">
            Visibility
            <select
              value={visibilityMode}
              name="item-image-display"
              onChange={e => onVisibilityModeChange(e.target.value as VisibilityMode)}
              className="h-7 rounded border border-gray-300 bg-black text-sm text-white"
              title="Item image display"
            >
              <option value="default" className="bg-black text-white">
                Default
              </option>
              <option value="hide-images" className="bg-black text-white">
                Hide Images
              </option>
              <option value="hide-info" className="bg-black text-white">
                Hide Info
              </option>
            </select>
          </label>
          <ContainImageFitToggle
            id="use-contain-image-fit"
            useContainImageFit={useContainImageFit}
            onUseContainImageFitChange={onUseContainImageFitChange}
            className=""
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <SortOrderSelect sortField={sortField} sortAsc={sortAsc} onChange={onSortChange} />
      </div>
    </section>
  )
}

export default DisplaySection
