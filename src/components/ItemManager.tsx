import { Session } from "@supabase/supabase-js"
import { ItemInput } from "./item-input/ItemInput"
import { useItemsRealtime } from "@/hooks/useItemsRealtime"
import { useMemo } from "react"
import { SortOrderSelect } from "./SortOrderSelect"
import { ListFilter } from "./ListFilter"
import { Database } from "@/types/supabase"
import { useUserLists } from "@/hooks/useUserLists"
import { Header } from "./header/Header"
import { Camelize } from "@/utils/camelize"
import SortedItemResults from "./sorted-item-results/SortedItemResults"
import ScrollToTopBtn from "./ScrollToTopBtn"
import useSessionStorage from "@/hooks/useSessionStorage"

export type DBProfile = Database["public"]["Tables"]["profiles"]["Row"]
export type DBList = Database["public"]["Tables"]["lists"]["Row"]
export type DBItem = Database["public"]["Tables"]["items"]["Row"]
export type DBListUser = Database["public"]["Tables"]["list_users"]["Row"]
export type DBListInvite = Database["public"]["Tables"]["list_invites"]["Row"]
export type DBListMember = Database["public"]["Views"]["list_members"]["Row"]

export type Profile = Camelize<DBProfile>
export type List = Camelize<DBList>
export type Item = Camelize<DBItem>
export type ListUser = Camelize<DBListUser>
export type ListInvite = Camelize<DBListInvite>
export type ListMember = Camelize<DBListMember>

export type LocalItem = Item & {
  signedUrl: string | null
  listName: string
}
export type LocalListInvite = ListInvite & {
  listName: string
}

export const nullListName = "Personal"

const SESSION_KEYS = {
  filteredListIds: "filteredListIds",
  selectedListId: "selectedListId",
  followInputList: "followInputList",
  sortAsc: "sortAsc"
} as const

export type SessionKey = (typeof SESSION_KEYS)[keyof typeof SESSION_KEYS]

function ItemManager({ session, onLogout }: { session: Session; onLogout: () => Promise<void> }) {
  const [filteredListIds, setFilteredListIds] = useSessionStorage<(string | null)[]>(SESSION_KEYS.filteredListIds, [null], session.user.id)
  const [selectedListId, setSelectedListId] = useSessionStorage<string | null>(SESSION_KEYS.selectedListId, null, session.user.id)
  const [followInputList, setFollowInputList] = useSessionStorage<boolean>(SESSION_KEYS.followInputList, true, session.user.id)
  const [sortAsc, setSortAsc] = useSessionStorage<boolean>(SESSION_KEYS.sortAsc, false, session.user.id)
  const userLists = useUserLists(session.user.id)

  const { items, loading, refreshItems } = useItemsRealtime(session, filteredListIds)

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return sortAsc ? timeA - timeB : timeB - timeA
    })
  }, [items, sortAsc])

  const handleItemInputListSelection = (listId: string | null) => {
    setSelectedListId(listId)
    if (followInputList) {
      setFilteredListIds([listId])
    }
  }
  const handleToggleFollowInputList = () => {
    setFollowInputList(prev => !prev)
    if (!followInputList) {
      setFilteredListIds([selectedListId])
    }
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
      <SortedItemResults loading={loading} sortedItems={sortedItems} />
      <ScrollToTopBtn />
    </div>
  )
}

export default ItemManager
