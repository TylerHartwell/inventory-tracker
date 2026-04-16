import BulkDeleteControl from "./BulkDeleteControl"

type ActionSectionProps = {
  isMultiSelectMode: boolean
  canStartMultiSelect: boolean
  eligibleSelectedCount: number
  allSelected: boolean
  bulkDeleteError: string | null
  isGalleryMode: boolean
  hasGalleryImages: boolean
  onStartMultiSelect: () => void
  onCancelMultiSelect: () => void
  onOpenBulkDeleteModal: () => void
  onSelectAllChange: (checked: boolean) => void
  onOpenImageSlides: () => void
}

function ActionSection({
  isMultiSelectMode,
  canStartMultiSelect,
  eligibleSelectedCount,
  allSelected,
  bulkDeleteError,
  isGalleryMode,
  hasGalleryImages,
  onStartMultiSelect,
  onCancelMultiSelect,
  onOpenBulkDeleteModal,
  onSelectAllChange,
  onOpenImageSlides
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
        {isGalleryMode && !isMultiSelectMode && (
          <button
            type="button"
            onClick={onOpenImageSlides}
            disabled={!hasGalleryImages}
            className="h-7 rounded border border-gray-500 px-2 text-xs text-white hover-fine:border-gray-300 active:border-gray-300 text-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            title="View all gallery images as a slideshow"
          >
            Image Slides
          </button>
        )}
      </div>
    </section>
  )
}

export default ActionSection
