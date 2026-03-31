import { Session } from "@supabase/supabase-js"
import { ItemInput } from "./item-input/ItemInput"
import { useItemsRealtime } from "@/hooks/useItemsRealtime"
import { useEffect, useMemo, useState } from "react"
import { SortOrderSelect } from "./SortOrderSelect"
import { ListFilter } from "./ListFilter"
import { Database } from "@/types/supabase"
import { useUserLists } from "@/hooks/useUserLists"
import { Header } from "./header/Header"
import { Camelize } from "@/utils/caseChanger"
import SortedItemResults from "./sorted-item-results/SortedItemResults"
import ScrollToTopBtn from "./ScrollToTopBtn"
import useSessionStorage from "@/hooks/useSessionStorage"
import { deleteItem } from "@/utils/item/deleteItem"
import BulkDeleteModal from "./BulkDeleteModal"
import BulkDeleteControl from "./BulkDeleteControl"
import { LayoutGrid, LayoutList } from "lucide-react"

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
  displayMode: "displayMode",
  gridColumns: "gridColumns"
} as const

export type SessionKey = (typeof SESSION_KEYS)[keyof typeof SESSION_KEYS]

function ItemManager({ session, onLogout }: { session: Session; onLogout: () => Promise<void> }) {
  const [filteredListIds, setFilteredListIds] = useSessionStorage<(string | null)[]>(SESSION_KEYS.filteredListIds, [null], session.user.id)
  const [selectedListId, setSelectedListId] = useSessionStorage<string | null>(SESSION_KEYS.selectedListId, null, session.user.id)
  const [followInputList, setFollowInputList] = useSessionStorage<boolean>(SESSION_KEYS.followInputList, true, session.user.id)
  const [sortAsc, setSortAsc] = useSessionStorage<boolean>(SESSION_KEYS.sortAsc, false, session.user.id)
  const [displayMode, setDisplayMode] = useSessionStorage<"stack" | "grid">(SESSION_KEYS.displayMode, "stack", session.user.id)
  const [gridColumns, setGridColumns] = useSessionStorage<1 | 2 | 3 | 4>(SESSION_KEYS.gridColumns, 3, session.user.id)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)
  const userLists = useUserLists(session.user.id)

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

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return sortAsc ? timeA - timeB : timeB - timeA
    })
  }, [items, sortAsc])

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
    <div className="max-w-xl mx-auto p-2 flex flex-col gap-2 ">
      <Header userEmail={session.user.email ?? ""} onLogout={onLogout} />
      <ItemInput
        session={session}
        refreshItems={refreshItems}
        selectedListId={selectedListId}
        onItemInputListChange={handleItemInputListSelection}
        userLists={userLists}
        onUpsert={onUpsert}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(min-content,25%)] justify-center items-center gap-1">
        <ListFilter
          filteredListIds={filteredListIds}
          onChange={setFilteredListIds}
          selectedListId={selectedListId}
          userLists={userLists}
          followInputList={followInputList}
          onToggleFollowInputList={handleToggleFollowInputList}
        />
        <SortOrderSelect sortAsc={sortAsc} onChange={setSortAsc} />
      </div>
      <div className="flex gap-2">
        <div className="border border-gray-300 rounded flex flex-1 items-center gap-2 text-sm">
          <label className="flex items-center gap-1 pl-2">
            Display
            <span aria-hidden="true" className="text-gray-600">
              {displayMode === "grid" ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
            </span>
            <select
              value={displayMode}
              onChange={e => setDisplayMode(e.target.value as "stack" | "grid")}
              className="h-7 rounded border border-gray-300 bg-black px-1 text-sm text-white"
              title="Display mode"
            >
              <option value="stack" className="bg-black text-white">
                Stack
              </option>
              <option value="grid" className="bg-black text-white">
                Grid
              </option>
            </select>
          </label>
          {displayMode === "grid" && (
            <label className="text-xs text-gray-600 flex items-center gap-1">
              Cols
              <select
                value={gridColumns}
                onChange={e => setGridColumns(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="h-7 rounded border border-gray-300 bg-black px-1 text-sm text-white"
                title="Grid columns"
              >
                <option value={1} className="bg-black text-white">
                  1
                </option>
                <option value={2} className="bg-black text-white">
                  2
                </option>
                <option value={3} className="bg-black text-white">
                  3
                </option>
                <option value={4} className="bg-black text-white">
                  4
                </option>
              </select>
            </label>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <BulkDeleteControl
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
      </div>
      <SortedItemResults
        loading={loading}
        hasCompletedInitialLoad={hasCompletedInitialLoad}
        sortedItems={sortedItems}
        onDelete={id => onDelete(id)}
        isMultiSelectMode={isMultiSelectMode}
        selectedItemIds={selectedItemIds}
        onToggleSelectedItem={handleToggleSelectedItem}
        displayMode={displayMode}
        gridColumns={gridColumns}
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
