import { useMemo, useState } from "react"
import { LocalItem } from "../ItemManager"
import { VisibilityMode } from "../DisplaySection"
import { ItemCard } from "./ItemCard"
import ItemImageGallery from "./ItemImageGallery"
import type { GalleryImage } from "./ItemImageGallery"
import ItemCardsSkeleton from "./ItemCardsSkeleton"
import LoadingSpinner from "./LoadingSpinner"
import ImageLightbox from "./ImageLightbox"

interface Props {
  loading: boolean
  hasCompletedInitialLoad: boolean
  sortedItems: LocalItem[]
  categoriesByListId: Map<string | null, string[]>
  onDelete: (id: string) => void
  isMultiSelectMode: boolean
  selectedItemIds: string[]
  onToggleSelectedItem: (id: string) => void
  layoutMode: "stack" | "grid" | "gallery"
  gridColumns: 1 | 2 | 3 | 4
  galleryColumns: 1 | 2 | 3 | 4
  visibilityMode: VisibilityMode
  useContainImageFit: boolean
  onUseContainImageFitChange: (value: boolean) => void
  showUnsetItemFields: boolean
  onShowUnsetItemFieldsChange: (value: boolean) => void
  isImageSlidesOpen: boolean
  onCloseImageSlides: () => void
}

const SortedItemResults = ({
  loading,
  hasCompletedInitialLoad,
  sortedItems,
  categoriesByListId,
  onDelete,
  isMultiSelectMode,
  selectedItemIds,
  onToggleSelectedItem,
  layoutMode,
  gridColumns,
  galleryColumns,
  visibilityMode,
  useContainImageFit,
  onUseContainImageFitChange,
  showUnsetItemFields,
  onShowUnsetItemFieldsChange,
  isImageSlidesOpen,
  onCloseImageSlides
}: Props) => {
  const [openDetailsItemId, setOpenDetailsItemId] = useState<string | null>(null)
  const [imageSlidesIndex, setImageSlidesIndex] = useState(0)
  const showInitialSkeleton = loading && sortedItems.length === 0 && !hasCompletedInitialLoad
  const selectedIdSet = new Set(selectedItemIds)
  const isGalleryMode = layoutMode === "gallery"
  const isGridMode = layoutMode === "grid"
  const gridColumnClass = gridColumns === 1 ? "grid-cols-1" : gridColumns === 2 ? "grid-cols-2" : gridColumns === 3 ? "grid-cols-3" : "grid-cols-4"
  const galleryImages = useMemo<GalleryImage[]>(() => {
    return sortedItems.reduce<GalleryImage[]>((acc, item) => {
      if (visibilityMode === "hide-images") {
        acc.push({
          key: `${item.id}-image-hidden`,
          url: null,
          itemId: item.id,
          canEdit: item.canEdit !== false,
          itemName: item.itemName,
          listName: item.listName,
          itemImageNumber: null,
          itemImageTotal: null
        })

        return acc
      }

      if (item.signedUrls.length === 0) {
        acc.push({
          key: `${item.id}-no-image`,
          url: null,
          itemId: item.id,
          canEdit: item.canEdit !== false,
          itemName: item.itemName,
          listName: item.listName,
          itemImageNumber: null,
          itemImageTotal: null
        })

        return acc
      }

      item.signedUrls.forEach((signedUrl, imageIndex) => {
        acc.push({
          key: `${item.id}-${imageIndex}-${signedUrl}`,
          url: signedUrl,
          itemId: item.id,
          canEdit: item.canEdit !== false,
          itemName: item.itemName,
          listName: item.listName,
          itemImageNumber: imageIndex + 1,
          itemImageTotal: item.signedUrls.length
        })
      })
      return acc
    }, [])
  }, [sortedItems, visibilityMode])
  const openDetailsIndex = useMemo(() => {
    if (!openDetailsItemId) {
      return -1
    }

    return sortedItems.findIndex(item => item.id === openDetailsItemId)
  }, [sortedItems, openDetailsItemId])

  const handleOpenPreviousDetails = () => {
    if (openDetailsIndex <= 0) {
      return
    }

    setOpenDetailsItemId(sortedItems[openDetailsIndex - 1]?.id ?? null)
  }

  const handleOpenNextDetails = () => {
    if (openDetailsIndex < 0 || openDetailsIndex >= sortedItems.length - 1) {
      return
    }

    setOpenDetailsItemId(sortedItems[openDetailsIndex + 1]?.id ?? null)
  }

  if (isGalleryMode) {
    const openDetailsItem = openDetailsItemId ? (sortedItems.find(item => item.id === openDetailsItemId) ?? null) : null
    const lightboxUrls = galleryImages.map(image => image.url).filter((url): url is string => url !== null)

    return (
      <div className="relative">
        {showInitialSkeleton ? (
          <ItemCardsSkeleton />
        ) : (
          <ItemImageGallery
            images={galleryImages}
            gridColumns={galleryColumns}
            visibilityMode={visibilityMode}
            useContainImageFit={useContainImageFit}
            onOpenItem={setOpenDetailsItemId}
            isMultiSelectMode={isMultiSelectMode}
            selectedItemIds={selectedIdSet}
            onToggleSelectedItem={onToggleSelectedItem}
          />
        )}
        {loading && !showInitialSkeleton && <LoadingSpinner />}

        {openDetailsItem && (
          <ul className="h-0 overflow-hidden">
            <ItemCard
              item={openDetailsItem}
              key={openDetailsItemId!}
              isPriority={false}
              categoriesByListId={categoriesByListId}
              onDelete={onDelete}
              isMultiSelectMode={false}
              isSelected={false}
              onToggleSelect={() => {}}
              isDetailsOpen={true}
              hasPreviousItem={openDetailsIndex > 0}
              hasNextItem={openDetailsIndex >= 0 && openDetailsIndex < sortedItems.length - 1}
              onOpenDetails={() => {}}
              onCloseDetails={() => setOpenDetailsItemId(null)}
              onOpenPreviousDetails={handleOpenPreviousDetails}
              onOpenNextDetails={handleOpenNextDetails}
              isGridMode={false}
              visibilityMode={visibilityMode}
              useContainImageFit={useContainImageFit}
              onUseContainImageFitChange={onUseContainImageFitChange}
              showUnsetItemFields={showUnsetItemFields}
              onShowUnsetItemFieldsChange={onShowUnsetItemFieldsChange}
            />
          </ul>
        )}

        {isImageSlidesOpen && lightboxUrls.length > 0 && (
          <ImageLightbox
            urls={lightboxUrls}
            index={imageSlidesIndex}
            onClose={() => {
              onCloseImageSlides()
              setImageSlidesIndex(0)
            }}
            onNavigate={setImageSlidesIndex}
          />
        )}
      </div>
    )
  }

  return (
    <ul className={`list-none p-0 relative${isGridMode ? ` grid ${gridColumnClass} gap-2` : ""}`}>
      {loading &&
        (showInitialSkeleton ? (
          <ItemCardsSkeleton />
        ) : (
          <>
            <LoadingSpinner />
            {sortedItems.map((item, index) => (
              <ItemCard
                item={item}
                key={item.id}
                isPriority={index <= 3}
                categoriesByListId={categoriesByListId}
                onDelete={onDelete}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={selectedIdSet.has(item.id)}
                onToggleSelect={onToggleSelectedItem}
                isDetailsOpen={item.id === openDetailsItemId}
                hasPreviousItem={openDetailsIndex > 0 && item.id === openDetailsItemId}
                hasNextItem={openDetailsIndex >= 0 && openDetailsIndex < sortedItems.length - 1 && item.id === openDetailsItemId}
                onOpenDetails={() => setOpenDetailsItemId(item.id)}
                onCloseDetails={() => setOpenDetailsItemId(currentId => (currentId === item.id ? null : currentId))}
                onOpenPreviousDetails={handleOpenPreviousDetails}
                onOpenNextDetails={handleOpenNextDetails}
                isGridMode={isGridMode}
                visibilityMode={visibilityMode}
                useContainImageFit={useContainImageFit}
                onUseContainImageFitChange={onUseContainImageFitChange}
                showUnsetItemFields={showUnsetItemFields}
                onShowUnsetItemFieldsChange={onShowUnsetItemFieldsChange}
              />
            ))}
          </>
        ))}
      {!loading &&
        (sortedItems.length === 0 ? (
          <div className={`text-center${isGridMode ? " col-span-full" : ""}`}>- No Results -</div>
        ) : (
          <>
            {sortedItems.map((item, index) => (
              <ItemCard
                item={item}
                key={item.id}
                isPriority={index <= 3}
                categoriesByListId={categoriesByListId}
                onDelete={onDelete}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={selectedIdSet.has(item.id)}
                onToggleSelect={onToggleSelectedItem}
                isDetailsOpen={item.id === openDetailsItemId}
                hasPreviousItem={openDetailsIndex > 0 && item.id === openDetailsItemId}
                hasNextItem={openDetailsIndex >= 0 && openDetailsIndex < sortedItems.length - 1 && item.id === openDetailsItemId}
                onOpenDetails={() => setOpenDetailsItemId(item.id)}
                onCloseDetails={() => setOpenDetailsItemId(currentId => (currentId === item.id ? null : currentId))}
                onOpenPreviousDetails={handleOpenPreviousDetails}
                onOpenNextDetails={handleOpenNextDetails}
                isGridMode={isGridMode}
                visibilityMode={visibilityMode}
                useContainImageFit={useContainImageFit}
                onUseContainImageFitChange={onUseContainImageFitChange}
                showUnsetItemFields={showUnsetItemFields}
                onShowUnsetItemFieldsChange={onShowUnsetItemFieldsChange}
              />
            ))}
          </>
        ))}
      {sortedItems.length !== 0 && (
        <div className={`h-10 flex items-center text-center justify-center${isGridMode ? " col-span-full" : ""}`}>---</div>
      )}
    </ul>
  )
}

export default SortedItemResults
