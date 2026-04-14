import BulkDeleteControl from "./BulkDeleteControl"

type ActionSectionProps = {
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

function ActionSection({
  isMultiSelectMode,
  canStartMultiSelect,
  eligibleSelectedCount,
  allSelected,
  bulkDeleteError,
  onStartMultiSelect,
  onCancelMultiSelect,
  onOpenBulkDeleteModal,
  onSelectAllChange
}: ActionSectionProps) {
  return (
    <section className="rounded border border-gray-700 p-2 flex flex-col gap-2">
      <div className="flex items-center justify-start gap-3 flex-wrap min-w-0">
        <h2 className="text-sm font-medium border-b border-r rounded border-gray-600 w-min pr-2 pb-1">Actions</h2>
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

export default ActionSection
