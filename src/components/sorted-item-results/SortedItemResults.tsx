import { useMemo, useState } from "react"
import { LocalItem } from "../ItemManager"
import { ItemCard } from "./ItemCard"
import ItemCardsSkeleton from "./ItemCardsSkeleton"
import LoadingSpinner from "./LoadingSpinner"

interface Props {
  loading: boolean
  hasCompletedInitialLoad: boolean
  sortedItems: LocalItem[]
  onDelete: (id: string) => void
  isMultiSelectMode: boolean
  selectedItemIds: string[]
  onToggleSelectedItem: (id: string) => void
  displayMode: "stack" | "grid"
  gridColumns: 1 | 2 | 3 | 4
}

const SortedItemResults = ({
  loading,
  hasCompletedInitialLoad,
  sortedItems,
  onDelete,
  isMultiSelectMode,
  selectedItemIds,
  onToggleSelectedItem,
  displayMode,
  gridColumns
}: Props) => {
  const [openDetailsItemId, setOpenDetailsItemId] = useState<string | null>(null)
  const showInitialSkeleton = loading && sortedItems.length === 0 && !hasCompletedInitialLoad
  const selectedIdSet = new Set(selectedItemIds)
  const isGridMode = displayMode === "grid"
  const gridColumnClass = gridColumns === 1 ? "grid-cols-1" : gridColumns === 2 ? "grid-cols-2" : gridColumns === 3 ? "grid-cols-3" : "grid-cols-4"
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
              />
            ))}
          </>
        ))}
      {sortedItems.length !== 0 && (
        <div className={`h-10 flex items-center text-center justify-center${isGridMode ? " col-span-full" : ""}`}>- End -</div>
      )}
    </ul>
  )
}

export default SortedItemResults
