import Image from "next/image"
import React, { ChangeEvent, useEffect, useRef, useState } from "react"

function ImageSelector({ handleLocalImage }: { handleLocalImage: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
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

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="w-full">
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {!previewUrl ? (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleButtonClick}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
          >
            📷 Select Photo
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex flex-col gap-2 ">
            <button
              type="button"
              onClick={handleButtonClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              📷 Select Photo
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              ✕ Remove Photo
            </button>
          </div>

          <div className="relative flex-1 max-w-lg aspect-[16/9] bg-transparent rounded-md overflow-hidden ">
            <Image src={previewUrl} alt="Preview" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageSelector
