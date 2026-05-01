import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
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
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="rounded border border-gray-700 p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium border-b border-r rounded border-gray-600 w-min pr-2 pb-1">Actions</h2>
        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          aria-expanded={isExpanded}
          aria-controls="action-section-controls"
          aria-label={isExpanded ? "Collapse action controls" : "Expand action controls"}
          className="p-1 bg-gray-700 text-white rounded hover-fine:outline-1 active:outline-1 w-fit cursor-pointer"
          title={isExpanded ? "Collapse action controls" : "Expand action controls"}
        >
          {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div id="action-section-controls" className="flex items-center justify-start gap-3 flex-wrap min-w-0">
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
      )}
    </section>
  )
}

export default ActionSection
