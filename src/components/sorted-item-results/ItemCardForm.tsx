import { Trash2 } from "lucide-react"
import ImageSelector from "../ImageSelector"
import { Item, LocalItem } from "../ItemManager"
import { ChangeEvent, useState } from "react"
import { ItemUpdateBundle } from "./ItemCard"

interface ItemCardFormProps {
  item: LocalItem
  onSubmit: (updates: ItemUpdateBundle) => Promise<void>
  signedUrl: LocalItem["signedUrl"]
  onCancelEdit: () => void
  onDeleteItem: () => Promise<void>
}

const ItemCardForm = ({ item, onSubmit, signedUrl, onCancelEdit, onDeleteItem }: ItemCardFormProps) => {
  const initialFormItem = {
    itemName: item.itemName,
    extraDetails: item.extraDetails,
    itemImage: null as File | null,
    category: item.category,
    expirationDate: item.expirationDate,
    listId: item.listId
  }

  const [formItem, setFormItem] = useState(initialFormItem)
  const [isChangingImage, setIsChangingImage] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormItem(prev => ({ ...prev, [name]: value }))
  }

  const handleImageFileChange = (file: File | null, isDeletingExisting = false) => {
    setFormItem(prev => {
      return {
        ...prev,
        itemImage: file
      }
    })

    setIsChangingImage(Boolean(file) || isDeletingExisting)
  }

  const handleCancelEdit = () => {
    setFormItem(initialFormItem)
    onCancelEdit()
  }

  const buildUpdateBundle = (): ItemUpdateBundle => {
    const updatedFields: Partial<Item> = {}

    if (formItem.itemName.trim() !== item.itemName) {
      updatedFields.itemName = formItem.itemName.trim()
    }

    if (formItem.extraDetails?.trim() !== item.extraDetails) {
      updatedFields.extraDetails = formItem.extraDetails?.trim()
    }

    if (formItem.category !== item.category) {
      updatedFields.category = formItem.category
    }

    if (formItem.expirationDate !== item.expirationDate) {
      updatedFields.expirationDate = formItem.expirationDate
    }

    if (formItem.listId !== item.listId) {
      updatedFields.listId = formItem.listId
    }

    return {
      updatedFields,
      itemImage: isChangingImage ? formItem.itemImage : undefined
    }
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSubmit(buildUpdateBundle())
      }}
    >
      <input
        name={"itemName"}
        value={formItem.itemName}
        onChange={handleChange}
        placeholder="Item Name"
        className="w-full px-1 rounded text-base font-normal border border-gray-300"
      />
      <textarea
        name="extraDetails"
        value={formItem.extraDetails ?? ""}
        onChange={handleChange}
        placeholder="Extra Details"
        className="w-full px-1 rounded text-base font-normal whitespace-pre-line border border-gray-300 min-h-20"
      />
      <div className="flex items-center mb-2">
        <ImageSelector onImageFileChange={handleImageFileChange} signedUrl={signedUrl} />
      </div>
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
          onClick={onDeleteItem}
          title="Delete item"
        >
          <Trash2 size={16} />
        </button>
        <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded hover-fine:outline-1 active:outline-1" title="Save changes">
          Save Changes
        </button>
      </div>
    </form>
  )
}

export default ItemCardForm
