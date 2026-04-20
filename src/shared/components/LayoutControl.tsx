import { Images, LayoutGrid, LayoutList } from "lucide-react"

type LayoutMode = "stack" | "grid" | "gallery"
type GridColumns = 1 | 2 | 3 | 4

type LayoutControlProps = {
  layoutMode: LayoutMode
  gridColumns: GridColumns
  galleryColumns: GridColumns
  onLayoutModeChange: (mode: LayoutMode) => void
  onGridColumnsChange: (cols: GridColumns) => void
  onGalleryColumnsChange: (cols: GridColumns) => void
}

function LayoutControl({
  layoutMode,
  gridColumns,
  galleryColumns,
  onLayoutModeChange,
  onGridColumnsChange,
  onGalleryColumnsChange
}: LayoutControlProps) {
  const activeColumns = layoutMode === "gallery" ? galleryColumns : gridColumns
  const onActiveColumnsChange = layoutMode === "gallery" ? onGalleryColumnsChange : onGridColumnsChange
  return (
    <>
      <div className=" rounded flex items-center gap-2 text-sm ">
        <label className="flex items-center gap-1">
          Layout
          <span aria-hidden="true" className="text-gray-600">
            {layoutMode === "grid" ? <LayoutGrid size={16} /> : layoutMode === "gallery" ? <Images size={16} /> : <LayoutList size={16} />}
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
            <option value="gallery" className="bg-black text-white">
              Gallery
            </option>
          </select>
        </label>
        {(layoutMode === "grid" || layoutMode === "gallery") && (
          <label className="text-xs text-gray-600 flex items-center gap-1">
            Cols
            <select
              value={activeColumns}
              name="grid-cols"
              onChange={e => onActiveColumnsChange(Number(e.target.value) as GridColumns)}
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
    </>
  )
}

export default LayoutControl
