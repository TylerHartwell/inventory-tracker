import BulkDeleteControl from "./BulkDeleteControl"
import ContainImageFitToggle from "./ContainImageFitToggle"
import LayoutControl from "./LayoutControl"
import { SortField, SortOrderSelect } from "./SortOrderSelect"

type LayoutMode = "stack" | "grid"
type GridColumns = 1 | 2 | 3 | 4

type DisplaySectionProps = {
  sortField: SortField
  sortAsc: boolean
  onSortChange: (field: SortField, asc: boolean) => void
  layoutMode: LayoutMode
  gridColumns: GridColumns
  useContainImageFit: boolean
  onLayoutModeChange: (mode: LayoutMode) => void
  onGridColumnsChange: (cols: GridColumns) => void
  onUseContainImageFitChange: (value: boolean) => void
  isMultiSelectMode: boolean
  canStartMultiSelect: boolean
  eligibleSelectedCount: number
  allSelected: boolean
  bulkDeleteError: string | null
  onStartMultiSelect: () => void
  onCancelMultiSelect: () => void
  onOpenBulkDeleteModal: () => void
  onSelectAllChange: (checked: boolean) => void
}

function DisplaySection({
  sortField,
  sortAsc,
  onSortChange,
  layoutMode,
  gridColumns,
  useContainImageFit,
  onLayoutModeChange,
  onGridColumnsChange,
  onUseContainImageFitChange,
  isMultiSelectMode,
  canStartMultiSelect,
  eligibleSelectedCount,
  allSelected,
  bulkDeleteError,
  onStartMultiSelect,
  onCancelMultiSelect,
  onOpenBulkDeleteModal,
  onSelectAllChange
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
        <ContainImageFitToggle
          id="use-contain-image-fit"
          useContainImageFit={useContainImageFit}
          onUseContainImageFitChange={onUseContainImageFitChange}
          className="ml-auto pr-2"
        />
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <SortOrderSelect sortField={sortField} sortAsc={sortAsc} onChange={onSortChange} />

        <BulkDeleteControl
          isMultiSelectMode={isMultiSelectMode}
          canStartMultiSelect={canStartMultiSelect}
          eligibleSelectedCount={eligibleSelectedCount}
          allSelected={allSelected}
          bulkDeleteError={bulkDeleteError}
          onStartMultiSelect={onStartMultiSelect}
          onCancelMultiSelect={onCancelMultiSelect}
          onOpenBulkDeleteModal={onOpenBulkDeleteModal}
          onSelectAllChange={onSelectAllChange}
        />
      </div>
    </section>
  )
}

export default DisplaySection
