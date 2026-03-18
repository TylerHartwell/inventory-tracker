import { Pencil, RotateCcw, Trash2, X } from "lucide-react"
import Image from "next/image"
import React, { ChangeEvent, useEffect, useRef, useState } from "react"

type SelectedImage = {
  key: string
  file: File
  previewUrl: string
}

function ImageSelector({
  onImageFileChange,
  signedUrls = [],
  imageIds = [],
  onFileInputClick
}: {
  onImageFileChange: (files: File[], deletedExistingImageIds?: string[]) => void
  signedUrls?: string[]
  imageIds?: string[]
  onFileInputClick?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const selectedImagesRef = useRef<SelectedImage[]>([])
  const onImageFileChangeRef = useRef(onImageFileChange)
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const [removedExistingImageIds, setRemovedExistingImageIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleFileInputClick = () => {
    onFileInputClick?.()
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length) handleFileSelection(files)
  }

  const handleFileSelection = (files: File[]) => {
    const validImageFiles = files.filter(file => file.type.startsWith("image/"))
    if (!validImageFiles.length) return

    clearFileInputToAllowReselection(fileInputRef)

    setSelectedImages(prev => {
      const newImages = validImageFiles.map((file, index) => ({
        key: `${Date.now()}-${index}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file)
      }))

      return [...prev, ...newImages]
    })
  }

  const handleRemoveSelectedImage = (selectedImageKey: string) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(image => image.key === selectedImageKey)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }

      return prev.filter(image => image.key !== selectedImageKey)
    })
  }

  const handleRemoveExisting = (imageId: string) => {
    setRemovedExistingImageIds(prev => {
      if (prev.includes(imageId)) return prev
      return [...prev, imageId]
    })
  }

  const handleUndoRemoveExisting = (imageId: string) => {
    setRemovedExistingImageIds(prev => prev.filter(id => id !== imageId))
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
    const files = Array.from(e.dataTransfer.files || [])

    if (files.length) handleFileSelection(files)
  }

  const clearFileInputToAllowReselection = (fileInputRef: React.RefObject<HTMLInputElement | null>) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const existingImages = signedUrls
    .map((signedUrl, index) => {
      const imageId = imageIds[index]

      return imageId
        ? {
            imageId,
            signedUrl
          }
        : null
    })
    .filter((image): image is { imageId: string; signedUrl: string } => Boolean(image))

  const visibleExistingImages = existingImages.filter(image => !removedExistingImageIds.includes(image.imageId))
  const removedExistingImages = existingImages.filter(image => removedExistingImageIds.includes(image.imageId))

  useEffect(() => {
    onImageFileChangeRef.current(
      selectedImages.map(selectedImage => selectedImage.file),
      removedExistingImageIds
    )
  }, [removedExistingImageIds, selectedImages])

  useEffect(() => {
    onImageFileChangeRef.current = onImageFileChange
  }, [onImageFileChange])

  useEffect(() => {
    selectedImagesRef.current = selectedImages
  }, [selectedImages])

  useEffect(() => {
    return () => {
      for (const selectedImage of selectedImagesRef.current) {
        URL.revokeObjectURL(selectedImage.previewUrl)
      }
    }
  }, [])

  return (
    <div className="w-full flex flex-col gap-2 relative justify-center items-center">
      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" />

      <div
        role="button"
        tabIndex={0}
        aria-label="Select images or drag and drop"
        className={`relative w-full min-h-28 flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onClick={handleFileInputClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {visibleExistingImages.length || selectedImages.length ? (
          <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
            {visibleExistingImages.map(existingImage => (
              <div key={existingImage.imageId} className="relative h-28 rounded border overflow-hidden bg-gray-100">
                <Image
                  src={existingImage.signedUrl}
                  alt="Existing item image"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    handleRemoveExisting(existingImage.imageId)
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded"
                  title="Remove existing image"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {selectedImages.map(selectedImage => (
              <div key={selectedImage.key} className="relative h-28 rounded border overflow-hidden bg-gray-100">
                <Image
                  src={selectedImage.previewUrl}
                  alt="Selected item image"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    handleRemoveSelectedImage(selectedImage.key)
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded"
                  title="Remove selected image"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 flex gap-1 items-center">
            <span className="pb-1">📷</span>
            <span className="text-nowrap">Select Images</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          name="file-input"
          onClick={handleFileInputClick}
          className="bg-blue-600 text-white flex items-center w-min px-4 py-2 rounded-md hover-fine:outline-1 active:outline-1 transition-colors duration-200 cursor-pointer"
          title="Select or change image"
        >
          <Pencil size={14} />
        </button>
        {removedExistingImages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              removedExistingImages.forEach(image => handleUndoRemoveExisting(image.imageId))
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover-fine:outline-1 active:outline-1 transition-colors duration-200 cursor-pointer"
            title="Undo all removed existing images"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {removedExistingImages.length > 0 && (
        <div className="w-full flex flex-wrap gap-2 text-sm">
          {removedExistingImages.map(image => (
            <button
              key={image.imageId}
              type="button"
              className="px-2 py-1 rounded bg-gray-100 border border-gray-300"
              onClick={() => handleUndoRemoveExisting(image.imageId)}
              title="Undo remove image"
            >
              Undo removed image
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageSelector
