import { Pencil, Trash2, X, RotateCcw } from "lucide-react"
import Image from "next/image"
import React, { ChangeEvent, useEffect, useRef, useState } from "react"

function ImageSelector({
  onImageFileChange,
  signedUrl = null
}: {
  onImageFileChange: (file: File | null, isDeletingExisting?: boolean) => void
  signedUrl?: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [existingRemoved, setExistingRemoved] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileInputClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null

    if (file) handleFileSelection(file)
  }

  const handleFileSelection = (file: File) => {
    onImageFileChange(file)
    clearFileInputToAllowReselection(fileInputRef)
    const url = URL.createObjectURL(file)

    setSelectedImageUrl(url)
  }
  const handleRemoveSelectedImage = () => {
    onImageFileChange(null)
    URL.revokeObjectURL(selectedImageUrl || "")
    setSelectedImageUrl(null)
  }

  const handleRemoveExisting = () => {
    setExistingRemoved(true)
    onImageFileChange(null, true)
  }
  const handleUndoRemoveExisting = () => {
    setExistingRemoved(false)
    onImageFileChange(null, false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0] || null

    if (file) handleFileSelection(file)
  }

  const clearFileInputToAllowReselection = (fileInputRef: React.RefObject<HTMLInputElement | null>) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const hasExistingImage = !!signedUrl
  const showExistingImage = hasExistingImage && !existingRemoved && !selectedImageUrl
  const showUndoExisting = hasExistingImage && existingRemoved && !selectedImageUrl
  const showCancelSelected = !!selectedImageUrl
  const imageToShowUrl = selectedImageUrl || (showExistingImage ? signedUrl : null)

  useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl)
      }
    }
  }, [selectedImageUrl])

  return (
    <div className="w-full flex relative justify-center items-center">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" />

      <div
        role="button"
        tabIndex={0}
        aria-label="Select an image or drag and drop"
        className={`relative w-1/2 aspect-[16/9] flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onClick={handleFileInputClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {imageToShowUrl ? (
          <div className="absolute w-full h-full flex-1  bg-transparent rounded-md ">
            <Image
              src={imageToShowUrl}
              alt="Preview"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
            />
          </div>
        ) : (
          <span className="text-gray-400 flex gap-1 items-center">
            <span className="pb-1">📷</span>
            <span className="text-nowrap">Select Image</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          name="file-input"
          onClick={handleFileInputClick}
          className="bg-blue-600 text-white flex items-center w-min px-4 py-2 rounded-md hover-fine:outline-1 active:outline-1 transition-colors duration-200 cursor-pointer"
          title="Select or change image"
        >
          <Pencil size={14} />
        </button>
        {showCancelSelected && (
          <button
            type="button"
            onClick={handleRemoveSelectedImage}
            className="absolute top-0 bg-red-600 h-min bottom-full text-white px-4 py-2 rounded-md hover-fine:outline-1 active:outline-1 transition-colors duration-200 cursor-pointer"
            title="Remove selected image"
          >
            <X size={14} />
          </button>
        )}
        {showExistingImage && (
          <button
            type="button"
            onClick={handleRemoveExisting}
            className="absolute top-0 bg-red-600 h-min bottom-full text-white px-4 py-2 rounded-md hover-fine:outline-1 active:outline-1 transition-colors duration-200 cursor-pointer"
            title="Remove existing image"
          >
            <Trash2 size={14} />
          </button>
        )}
        {showUndoExisting && (
          <button
            type="button"
            onClick={handleUndoRemoveExisting}
            className="absolute top-0 bg-red-600 h-min bottom-full text-white px-4 py-2 rounded-md hover-fine:outline-1 active:outline-1 transition-colors duration-200 cursor-pointer"
            title="Undo remove existing image"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default ImageSelector
