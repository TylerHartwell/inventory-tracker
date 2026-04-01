import { Trash2 } from "lucide-react"
import ImageSelector from "../ImageSelector"
import { Item, LocalItem } from "../ItemManager"
import { ChangeEvent, useState } from "react"
import { ItemUpdateBundle } from "./ItemCard"

interface ItemCardFormProps {
  item: LocalItem
  onSubmit: (updates: ItemUpdateBundle) => Promise<void>
  onCancelEdit: () => void
  onDeleteItem: () => Promise<void>
}

const ItemCardForm = ({ item, onSubmit, onCancelEdit, onDeleteItem }: ItemCardFormProps) => {
  const initialFormItem = {
    itemName: item.itemName,
    extraDetails: item.extraDetails,
    itemImages: [] as File[],
    deletedImageIds: [] as string[],
    category: item.category,
    expirationDate: item.expirationDate,
    listId: item.listId
  }

  const [formItem, setFormItem] = useState(initialFormItem)
  const [isChangingImage, setIsChangingImage] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [showUnsetFields, setShowUnsetFields] = useState(false)

  const hasExistingImages = item.signedUrls.length > 0
  const hadExtraDetails = Boolean((item.extraDetails ?? "").trim())
  const hadCategory = Boolean((item.category ?? "").trim())
  const hadExpirationDate = Boolean(item.expirationDate)
  const hasCollapsedUnsetFields = !hasExistingImages || !hadExtraDetails || !hadCategory || !hadExpirationDate

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormItem(prev => ({ ...prev, [name]: value }))
  }

  const handleImageFileChange = (files: File[], deletedImageIds: string[] = []) => {
    setFormItem(prev => {
      return {
        ...prev,
        itemImages: files,
        deletedImageIds
      }
    })

    setIsChangingImage(Boolean(files.length) || Boolean(deletedImageIds.length))
  }

  const handleCancelEdit = () => {
    setFormItem(initialFormItem)
    setShowUnsetFields(false)
    onCancelEdit()
  }

  const buildUpdateBundle = (): ItemUpdateBundle => {
    const updatedFields: Partial<Item> = {}

    if (formItem.itemName.trim() !== item.itemName) {
      updatedFields.itemName = formItem.itemName.trim()
    }

    const normalizedExtraDetails = formItem.extraDetails?.trim() ?? null
    const currentExtraDetails = item.extraDetails ?? null

    if (normalizedExtraDetails !== currentExtraDetails) {
      updatedFields.extraDetails = normalizedExtraDetails
    }

    if (formItem.category !== item.category) {
      updatedFields.category = formItem.category
    }

    const normalizedExpirationDate = formItem.expirationDate || null
    const currentExpirationDate = item.expirationDate || null

    if (normalizedExpirationDate !== currentExpirationDate) {
      updatedFields.expirationDate = normalizedExpirationDate
    }

    if (formItem.listId !== item.listId) {
      updatedFields.listId = formItem.listId
    }

    return {
      updatedFields,
      itemImages: isChangingImage ? formItem.itemImages : undefined,
      deletedImageIds: isChangingImage ? formItem.deletedImageIds : undefined
    }
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSubmit(buildUpdateBundle())
      }}
      className="flex flex-col gap-2 text-white"
    >
      {(hasExistingImages || showUnsetFields) && (
        <div className="flex items-center mb-2">
          <ImageSelector onImageFileChange={handleImageFileChange} signedUrls={item.signedUrls} imageIds={item.imageIds} />
        </div>
      )}
      <input
        name={"itemName"}
        value={formItem.itemName}
        onChange={handleChange}
        placeholder="Item Name"
        className="w-full px-1 rounded text-base font-normal border border-gray-300 bg-gray-900"
      />
      {(hadExtraDetails || showUnsetFields) && (
        <textarea
          name="extraDetails"
          value={formItem.extraDetails ?? ""}
          onChange={handleChange}
          placeholder="Extra Details"
          className="w-full px-1 rounded text-base font-normal whitespace-pre-line border border-gray-300 min-h-20 bg-gray-900"
        />
      )}
      {(hadCategory || hadExpirationDate || showUnsetFields) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(hadCategory || showUnsetFields) && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-300">Category</span>
              <input
                name="category"
                value={formItem.category ?? ""}
                onChange={handleChange}
                placeholder="Category"
                className="w-full px-1 rounded text-base font-normal border border-gray-300 bg-gray-900"
              />
            </label>
          )}
          {(hadExpirationDate || showUnsetFields) && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-300">Expiration Date</span>
              <input
                type="date"
                name="expirationDate"
                value={formItem.expirationDate ?? ""}
                onChange={handleChange}
                className={`w-full px-1 rounded text-base font-normal border border-gray-300 bg-gray-900 scheme-dark ${
                  formItem.expirationDate ? "text-white" : "text-gray-400"
                }`}
              />
            </label>
          )}
        </div>
      )}
      {hasCollapsedUnsetFields && (
        <button
          type="button"
          className="self-start px-3 py-1 bg-gray-700 text-white rounded hover-fine:outline-1 active:outline-1"
          onClick={() => setShowUnsetFields(prev => !prev)}
          title={showUnsetFields ? "Hide unset fields" : "Show unset fields"}
        >
          {showUnsetFields ? "Hide unset fields" : "Show unset fields"}
        </button>
      )}
      <div className="flex justify-between">
        <button
          type="button"
          name="cancelEdit"
          className="px-4 py-2 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1"
          onClick={handleCancelEdit}
          title="Cancel editing"
        >
          Cancel
        </button>
        <button
          type="button"
          name="deleteItem"
          className="px-4 py-2 bg-red-600 text-white rounded hover-fine:outline-1 active:outline-1"
          onClick={() => setIsDeleteModalOpen(true)}
          title="Delete item"
        >
          <Trash2 size={16} />
        </button>
        <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1" title="Save changes">
          Save Changes
        </button>
      </div>

      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onPointerDown={e => {
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false)
            }
          }}
        >
          <div className="w-full max-w-sm rounded-xl bg-gray-700 p-4 text-white shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete Item?</h3>
            <p className="mt-2 text-sm text-gray-200">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-500 text-white rounded hover-fine:outline-1 active:outline-1"
                onClick={() => setIsDeleteModalOpen(false)}
                title="Cancel delete"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-700 text-white rounded hover-fine:outline-1 active:outline-1"
                onClick={async () => {
                  await onDeleteItem()
                  setIsDeleteModalOpen(false)
                }}
                title="Delete item"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default ItemCardForm
