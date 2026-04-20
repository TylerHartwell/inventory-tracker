import { CopyX } from "lucide-react"

type BulkDeleteControlProps = {
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

function BulkDeleteControl({
  isMultiSelectMode,
  canStartMultiSelect,
  eligibleSelectedCount,
  allSelected,
  bulkDeleteError,
  onStartMultiSelect,
  onCancelMultiSelect,
  onOpenBulkDeleteModal,
  onSelectAllChange
}: BulkDeleteControlProps) {
  return (
    <div className="rounded  flex flex-col gap-2 mr-2">
      <div className="flex items-center justify-end gap-2">
        {!isMultiSelectMode ? (
          <div className="flex items-center gap-1 text-sm">
            <span className="text-sm text-nowrap text-gray-500">Bulk Delete:</span>
            <button
              type="button"
              className="h-6 px-3 py-1 bg-red-500 text-white rounded hover-fine:outline-1 active:outline-1"
              onClick={onStartMultiSelect}
              disabled={!canStartMultiSelect}
              title={!canStartMultiSelect ? "No items available to select for deletion" : "Start multi-select mode for deletion"}
            >
              <CopyX size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm ">
            <button
              type="button"
              className="h-6 px-3 py-1 bg-gray-500 text-white rounded hover-fine:outline-1 active:outline-1 flex items-center"
              onClick={onCancelMultiSelect}
              title="Cancel multi-select mode"
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-6 px-3 py-1 bg-red-600 text-white rounded hover-fine:outline-1 active:outline-1 disabled:opacity-50 flex items-center"
              onClick={onOpenBulkDeleteModal}
              disabled={eligibleSelectedCount === 0}
              title={
                eligibleSelectedCount === 0
                  ? "No eligible items selected for deletion"
                  : `Delete ${eligibleSelectedCount} selected item${eligibleSelectedCount > 1 ? "s" : ""}`
              }
            >
              Delete {eligibleSelectedCount} Selected
            </button>
            <label className="inline-flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
              Select All
              <input
                type="checkbox"
                checked={allSelected}
                onChange={e => onSelectAllChange(e.target.checked)}
                className="h-4 w-4 accent-blue-500 cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {bulkDeleteError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">{bulkDeleteError}</p>}
    </div>
  )
}

export default BulkDeleteControl
