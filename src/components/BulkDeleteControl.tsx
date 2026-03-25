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
    <div className="border border-gray-300 rounded p-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!isMultiSelectMode ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-sm text-gray-500">Select multiple for deletion:</span>
            <button
              type="button"
              className="h-6 px-3 py-1 bg-red-500 text-white rounded hover-fine:outline-1 active:outline-1"
              onClick={onStartMultiSelect}
              disabled={!canStartMultiSelect}
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
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-6 px-3 py-1 bg-red-600 text-white rounded hover-fine:outline-1 active:outline-1 disabled:opacity-50 flex items-center"
              onClick={onOpenBulkDeleteModal}
              disabled={eligibleSelectedCount === 0}
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
