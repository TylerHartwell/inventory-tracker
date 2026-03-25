type BulkDeleteModalProps = {
  selectedCount: number
  onClose: () => void
  onConfirm: () => void
}

function BulkDeleteModal({ selectedCount, onClose, onConfirm }: BulkDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-sm rounded-xl bg-gray-700 p-4 text-white shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Delete Selected Items?</h3>
        <p className="mt-2 text-sm text-gray-200">
          {selectedCount === 1
            ? "This will permanently delete 1 item. This action cannot be undone."
            : `This will permanently delete ${selectedCount} items. This action cannot be undone.`}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="px-4 py-2 bg-gray-500 text-white rounded hover-fine:outline-1 active:outline-1" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="px-4 py-2 bg-red-700 text-white rounded hover-fine:outline-1 active:outline-1" onClick={onConfirm}>
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkDeleteModal
