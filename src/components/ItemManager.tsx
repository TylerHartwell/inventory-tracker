import { Session } from "@supabase/supabase-js"
import { ItemInput } from "./item-input/ItemInput"
import { useItemsRealtime } from "@/hooks/useItemsRealtime"
import { useEffect, useMemo, useState } from "react"
import { SortField } from "./SortOrderSelect"
import { Database } from "@/types/supabase"
import { useUserLists } from "@/hooks/useUserLists"
import { Header } from "./header/Header"
import { Camelize } from "@/utils/caseChanger"
import SortedItemResults from "./sorted-item-results/SortedItemResults"
import ScrollToTopBtn from "./ScrollToTopBtn"
import useSessionStorage from "@/hooks/useSessionStorage"
import { deleteItem } from "@/utils/item/deleteItem"
import BulkDeleteModal from "./BulkDeleteModal"
import FilterSection, { ImageFilterMode, OptionalFilterType } from "./FilterSection"
import DisplaySection, { VisibilityMode } from "./DisplaySection"
import ActionSection from "./ActionSection"

export type DBProfile = Database["public"]["Tables"]["profiles"]["Row"]
export type DBList = Database["public"]["Tables"]["lists"]["Row"]
export type DBItem = Database["public"]["Tables"]["items"]["Row"]
export type DBItemImage = Database["public"]["Tables"]["item_images"]["Row"]
export type DBListUser = Database["public"]["Tables"]["list_users"]["Row"]
export type DBListInvite = Database["public"]["Tables"]["list_invites"]["Row"]
export type DBListMember = Database["public"]["Views"]["list_members"]["Row"]

export type Profile = Camelize<DBProfile>
export type List = Camelize<DBList>
export type Item = Camelize<DBItem>
export type ItemImage = Camelize<DBItemImage>
export type ListUser = Camelize<DBListUser>
export type ListInvite = Camelize<DBListInvite>
export type ListMember = Camelize<DBListMember>

export type LocalItem = Item & {
  imageUrls: string[]
  imageIds: string[]
  signedUrls: string[]
  listName: string
  canEdit?: boolean
}
export type LocalListInvite = ListInvite & {
  listName: string
}

export type InsertableDBItem = Pick<DBItem, "item_name" | "list_id"> & Partial<Omit<DBItem, "item_name" | "list_id">>
export type InsertableItem = Camelize<InsertableDBItem>

export const nullListName = "Personal"

const SESSION_KEYS = {
  filteredListIds: "filteredListIds",
  selectedListId: "selectedListId",
  followInputList: "followInputList",
  sortAsc: "sortAsc",
  sortField: "sortField",
  optionalFilterType: "optionalFilterType",
  imageFilterMode: "imageFilterMode",
  layoutMode: "layoutMode",
  gridColumns: "gridColumns",
  galleryColumns: "galleryColumns",
  visibilityMode: "visibilityMode",
  gridVisibilityMode: "gridVisibilityMode",
  galleryVisibilityMode: "galleryVisibilityMode",
  useContainImageFit: "useContainImageFit",
  showUnsetItemFields: "showUnsetItemFields"
} as const

export type SessionKey = (typeof SESSION_KEYS)[keyof typeof SESSION_KEYS]

function ItemManager({ session, onLogout }: { session: Session; onLogout: () => Promise<void> }) {
  const [filteredListIds, setFilteredListIds] = useSessionStorage<(string | null)[]>(SESSION_KEYS.filteredListIds, [null], session.user.id)
  const [selectedListId, setSelectedListId] = useSessionStorage<string | null>(SESSION_KEYS.selectedListId, null, session.user.id)
  const [followInputList, setFollowInputList] = useSessionStorage<boolean>(SESSION_KEYS.followInputList, true, session.user.id)
  const [sortAsc, setSortAsc] = useSessionStorage<boolean>(SESSION_KEYS.sortAsc, false, session.user.id)
  const [sortField, setSortField] = useSessionStorage<SortField>(SESSION_KEYS.sortField, "createdAt", session.user.id)
  const [optionalFilterType, setOptionalFilterType] = useSessionStorage<OptionalFilterType | null>(
    SESSION_KEYS.optionalFilterType,
    null,
    session.user.id
  )
  const [imageFilterMode, setImageFilterMode] = useSessionStorage<ImageFilterMode>(SESSION_KEYS.imageFilterMode, "with-images", session.user.id)
  const [layoutMode, setLayoutMode] = useSessionStorage<"stack" | "grid" | "gallery">(SESSION_KEYS.layoutMode, "stack", session.user.id)
  const [gridColumns, setGridColumns] = useSessionStorage<1 | 2 | 3 | 4>(SESSION_KEYS.gridColumns, 3, session.user.id)
  const [galleryColumns, setGalleryColumns] = useSessionStorage<1 | 2 | 3 | 4>(SESSION_KEYS.galleryColumns, 3, session.user.id)
  const [visibilityMode, setVisibilityMode] = useSessionStorage<VisibilityMode>(SESSION_KEYS.visibilityMode, "default", session.user.id)
  const [gridVisibilityMode, setGridVisibilityMode] = useSessionStorage<VisibilityMode>(SESSION_KEYS.gridVisibilityMode, "default", session.user.id)
  const [galleryVisibilityMode, setGalleryVisibilityMode] = useSessionStorage<VisibilityMode>(
    SESSION_KEYS.galleryVisibilityMode,
    "default",
    session.user.id
  )
  const activeVisibilityMode = layoutMode === "grid" ? gridVisibilityMode : layoutMode === "gallery" ? galleryVisibilityMode : visibilityMode
  const setActiveVisibilityMode =
    layoutMode === "grid" ? setGridVisibilityMode : layoutMode === "gallery" ? setGalleryVisibilityMode : setVisibilityMode
  const [useContainImageFit, setUseContainImageFit] = useSessionStorage<boolean>(SESSION_KEYS.useContainImageFit, true, session.user.id)
  const [showUnsetItemFields, setShowUnsetItemFields] = useSessionStorage<boolean>(SESSION_KEYS.showUnsetItemFields, false, session.user.id)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)
  const userLists = useUserLists(session.user.id)

  const allListIds = useMemo<(string | null)[]>(() => [null, ...userLists.lists.map(list => list.id)], [userLists.lists])
  const { items, loading, hasCompletedInitialLoad, refreshItems, onDelete, onUpsert } = useItemsRealtime(session.user.id, filteredListIds)

  useEffect(() => {
    if (userLists.loading) return

    const validListIds = new Set(userLists.lists.map(list => list.id))

    const sanitizedFilteredListIds = filteredListIds.filter(listId => listId === null || validListIds.has(listId))
    const nextFilteredListIds = sanitizedFilteredListIds.length > 0 ? sanitizedFilteredListIds : [null]

    const didFilteredChange =
      nextFilteredListIds.length !== filteredListIds.length || nextFilteredListIds.some((listId, index) => listId !== filteredListIds[index])

    if (didFilteredChange) {
      setFilteredListIds(nextFilteredListIds)
    }

    const hasValidSelectedList = selectedListId === null || validListIds.has(selectedListId)

    if (!hasValidSelectedList) {
      setSelectedListId(null)
    }
  }, [filteredListIds, selectedListId, setFilteredListIds, setSelectedListId, userLists.lists, userLists.loading])

  const filteredItems = useMemo(() => {
    const selectedListIds = new Set(filteredListIds)
    const isListFilterActive = allListIds.some(id => !selectedListIds.has(id))
    const isImageFilterActive = optionalFilterType === "images"

    const matchesListFilter = (listId: string | null) => selectedListIds.has(listId)
    const matchesImageFilter = (imageIds: string[]) => {
      if (imageFilterMode === "with-images") {
        return imageIds.length > 0
      }

      if (imageFilterMode === "without-images") {
        return imageIds.length === 0
      }

      return false
    }

    if (!isListFilterActive && !isImageFilterActive) {
      return items
    }

    return items.filter(item => {
      const matchesList = matchesListFilter(item.listId ?? null)
      const matchesImage = matchesImageFilter(item.imageIds)

      return (!isListFilterActive || matchesList) && (!isImageFilterActive || matchesImage)
    })
  }, [allListIds, filteredListIds, imageFilterMode, items, optionalFilterType])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      switch (sortField) {
        case "createdAt":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
        case "lastUpdatedAt":
          return (new Date(a.lastUpdatedAt).getTime() - new Date(b.lastUpdatedAt).getTime()) * dir
        case "expirationDate": {
          if (!a.expirationDate && !b.expirationDate) return 0
          if (!a.expirationDate) return 1
          if (!b.expirationDate) return -1
          return (new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()) * dir
        }
        case "itemName":
          return a.itemName.localeCompare(b.itemName) * dir
        default:
          return 0
      }
    })
  }, [filteredItems, sortAsc, sortField])

  const hasPresentImagesFilterActive = optionalFilterType === "images" && imageFilterMode === "with-images"

  const selectableItemIds = useMemo(() => {
    return new Set(sortedItems.filter(item => item.canEdit !== false).map(item => item.id))
  }, [sortedItems])

  const eligibleSelectedItemIds = useMemo(() => selectedItemIds.filter(id => selectableItemIds.has(id)), [selectedItemIds, selectableItemIds])

  const handleItemInputListSelection = (listId: string | null) => {
    setSelectedListId(listId)
    if (followInputList) {
      setFilteredListIds([listId])
    }
  }

  const handleToggleFollowInputList = () => {
    setFollowInputList(!followInputList)
    if (!followInputList) {
      setFilteredListIds([selectedListId])
    }
  }

  const handleAddOptionalFilter = (filterType: OptionalFilterType) => {
    setOptionalFilterType(filterType)
  }

  const handleRemoveOptionalFilter = () => {
    setOptionalFilterType(null)
  }

  const handleFilterToImagesOnly = () => {
    setOptionalFilterType("images")
    setImageFilterMode("with-images")
  }

  const handleStartMultiSelect = () => {
    setBulkDeleteError(null)
    setSelectedItemIds([])
    setIsMultiSelectMode(true)
  }

  const handleCancelMultiSelect = () => {
    setBulkDeleteError(null)
    setSelectedItemIds([])
    setIsBulkDeleteModalOpen(false)
    setIsMultiSelectMode(false)
  }

  const handleToggleSelectedItem = (id: string) => {
    if (!selectableItemIds.has(id)) return

    setSelectedItemIds(prev => (prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]))
  }

  const allSelected = selectableItemIds.size > 0 && [...selectableItemIds].every(id => selectedItemIds.includes(id))

  const handleSelectAllChange = (checked: boolean) => {
    setSelectedItemIds(checked ? [...selectableItemIds] : [])
  }

  const handleDeleteSelected = async () => {
    if (eligibleSelectedItemIds.length === 0) {
      setIsBulkDeleteModalOpen(false)
      return
    }

    setBulkDeleteError(null)

    const results = await Promise.all(
      eligibleSelectedItemIds.map(async id => {
        const { error } = await deleteItem({ itemId: id })
        return { id, error }
      })
    )

    const failedIds = results.filter(result => result.error).map(result => result.id)
    const successfulIds = results.filter(result => !result.error).map(result => result.id)

    successfulIds.forEach(id => onDelete(id))

    if (failedIds.length > 0) {
      setSelectedItemIds(failedIds)
      setBulkDeleteError(
        failedIds.length === 1
          ? "Failed to delete 1 selected item. Please try again."
          : `Failed to delete ${failedIds.length} selected items. Please try again.`
      )
      setIsBulkDeleteModalOpen(false)
      return
    }

    handleCancelMultiSelect()
  }

  return (
    // max-w starts at 100% on small screens until md breakpoint of 768px, then linearly scales to 5/6 of the screen width at lg breakpoint of 1024px, and remains at 5/6 on larger screens
    <div className="max-w-[clamp((100%*5/6),calc(100%-((100vw-768px)/(1024px-768px))*(100%-(100%*5/6))),100%)] mx-auto p-2 flex flex-col gap-2 ">
      <Header userEmail={session.user.email ?? ""} onLogout={onLogout} />
      <ItemInput
        session={session}
        refreshItems={refreshItems}
        selectedListId={selectedListId}
        onItemInputListChange={handleItemInputListSelection}
        userLists={userLists}
        onUpsert={onUpsert}
      />
      <div className="flex flex-col gap-2">
        <FilterSection
          filteredListIds={filteredListIds}
          onFilteredListIdsChange={setFilteredListIds}
          selectedListId={selectedListId}
          userLists={userLists}
          followInputList={followInputList}
          onToggleFollowInputList={handleToggleFollowInputList}
          optionalFilterType={optionalFilterType}
          onAddOptionalFilter={handleAddOptionalFilter}
          onRemoveOptionalFilter={handleRemoveOptionalFilter}
          imageFilterMode={imageFilterMode}
          onImageFilterModeChange={setImageFilterMode}
        />

        <DisplaySection
          sortField={sortField}
          sortAsc={sortAsc}
          onSortChange={(field, asc) => {
            setSortField(field)
            setSortAsc(asc)
          }}
          layoutMode={layoutMode}
          gridColumns={gridColumns}
          galleryColumns={galleryColumns}
          visibilityMode={activeVisibilityMode}
          showFilterToImagesOnlyAction={!hasPresentImagesFilterActive}
          useContainImageFit={useContainImageFit}
          onLayoutModeChange={setLayoutMode}
          onGridColumnsChange={setGridColumns}
          onGalleryColumnsChange={setGalleryColumns}
          onVisibilityModeChange={setActiveVisibilityMode}
          onFilterToImagesOnly={handleFilterToImagesOnly}
          onUseContainImageFitChange={setUseContainImageFit}
        />

        <ActionSection
          isMultiSelectMode={isMultiSelectMode}
          canStartMultiSelect={selectableItemIds.size > 0}
          eligibleSelectedCount={eligibleSelectedItemIds.length}
          allSelected={allSelected}
          bulkDeleteError={bulkDeleteError}
          onStartMultiSelect={handleStartMultiSelect}
          onCancelMultiSelect={handleCancelMultiSelect}
          onOpenBulkDeleteModal={() => setIsBulkDeleteModalOpen(true)}
          onSelectAllChange={handleSelectAllChange}
        />
      </div>

      <SortedItemResults
        loading={loading}
        hasCompletedInitialLoad={hasCompletedInitialLoad}
        sortedItems={sortedItems}
        onDelete={id => onDelete(id)}
        isMultiSelectMode={isMultiSelectMode}
        selectedItemIds={selectedItemIds}
        onToggleSelectedItem={handleToggleSelectedItem}
        layoutMode={layoutMode}
        gridColumns={gridColumns}
        galleryColumns={galleryColumns}
        visibilityMode={activeVisibilityMode}
        useContainImageFit={useContainImageFit}
        onUseContainImageFitChange={setUseContainImageFit}
        showUnsetItemFields={showUnsetItemFields}
        onShowUnsetItemFieldsChange={setShowUnsetItemFields}
      />
      <ScrollToTopBtn />

      {isBulkDeleteModalOpen && (
        <BulkDeleteModal
          selectedCount={eligibleSelectedItemIds.length}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleDeleteSelected}
        />
      )}
    </div>
  )
}

export default ItemManager
