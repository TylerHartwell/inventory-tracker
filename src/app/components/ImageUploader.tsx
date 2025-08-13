import Image from "next/image"
import React, { ChangeEvent, useEffect, useRef, useState } from "react"

function ImageUploader({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
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
    <div className="text-center flex flex-col">
      <button
        type="button"
        onClick={handleButtonClick}
        className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 mb-4 flex items-center gap-2 mx-auto"
      >
        📷 Add Photo
      </button>

      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {previewUrl && (
        <div className="relative max-w-full max-h-[400px] mx-auto h-[200] w-full">
          <Image src={previewUrl} alt="Preview" fill className="object-contain" />
        </div>
      )}
    </div>
  )
}

export default ImageUploader
