import { Pencil, X } from "lucide-react"
import Image from "next/image"
import React, { ChangeEvent, useEffect, useRef, useState } from "react"

function ImageSelector({ handleLocalImage, signedUrl = null }: { handleLocalImage: (file: File | null) => void; signedUrl?: string | null }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    return signedUrl ? signedUrl : null
  })
  const [isDragging, setIsDragging] = useState(false)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (file: File | null) => {
    if (file) {
      handleLocalImage(file)

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
  }

  const handleRemoveImage = () => {
    handleLocalImage(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0] || null
    handleFileChange(file)
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="w-full flex justify-center items-center">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleInputChange} className="hidden" />

      <div
        role="button"
        tabIndex={0}
        aria-label="Select an image or drag and drop"
        className={`relative w-1/2 aspect-[16/9] flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer overflow-hidden ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="absolute w-full h-full flex-1  bg-transparent rounded-md overflow-hidden">
            <Image
              src={previewUrl}
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

      <div className="flex flex-col gap-2 ">
        <button
          type="button"
          onClick={handleButtonClick}
          className="bg-blue-600 text-white flex items-center w-min px-4 py-2 rounded-md hover-fine:outline-1 active:outline-1 transition-colors duration-200 cursor-pointer"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={handleRemoveImage}
          className="bg-red-600 w-min text-white px-4 py-2 rounded-md hover-fine:outline-1 active:outline-1 transition-colors duration-200"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default ImageSelector
