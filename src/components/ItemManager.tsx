import { Session } from "@supabase/supabase-js"
import { ItemInput } from "./ItemInput"
import { ItemCard } from "./ItemCard"
import { useItemsRealtime } from "@/hooks/useItemsRealtime"
import { useMemo, useState } from "react"
import { SortOrderSelect } from "./SortOrderSelect"
import { ListFilter } from "./ListFilter"
import { Database } from "@/types/supabase"
import { useUserLists } from "@/hooks/useUserLists"
import { Header } from "./Header"

export type List = Database["public"]["Tables"]["lists"]["Row"]
export type Item = Database["public"]["Tables"]["items"]["Row"]
export type ListUser = Database["public"]["Tables"]["list_users"]["Row"]

export type LocalItem = Item & {
  signedUrl: string | null
}

function ItemManager({ session, onLogout }: { session: Session; onLogout: () => Promise<void> }) {
  const [filteredLists, setFilteredLists] = useState<(string | null)[]>([null])
  const [selectedList, setSelectedList] = useState<string | null>(null)

  const userLists = useUserLists(session.user.id)

  const { items, loading, refresh } = useItemsRealtime(session, filteredLists)
  const [sortAsc, setSortAsc] = useState(false)

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime()
      const timeB = new Date(b.created_at).getTime()
      return sortAsc ? timeA - timeB : timeB - timeA
    })
  }, [items, sortAsc])

  const handleItemInputListSelection = (listId: string | null) => {
    setSelectedList(listId)
    setFilteredLists(prev => (prev.includes(listId) ? prev : [...prev, listId]))
  }

  return (
    <div className="max-w-xl mx-auto p-2 flex flex-col gap-2 ">
      <Header userEmail={session.user.email ?? ""} onLogout={onLogout} />

      <ItemInput
        session={session}
        refresh={refresh}
        selectedList={selectedList}
        onItemInputListChange={handleItemInputListSelection}
        userLists={userLists}
      />
      <div className="flex justify-end items-start gap-2">
        <ListFilter filteredLists={filteredLists} onChange={setFilteredLists} selectedList={selectedList} userLists={userLists} />
        <SortOrderSelect sortAsc={sortAsc} onChange={setSortAsc} />
      </div>

      <ul className="list-none p-0 relative">
        {loading &&
          (sortedItems.length === 0 ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="border border-gray-300 rounded p-4 mb-2 animate-pulse">
                  <div className="h-8 w-3/4 bg-gray-900 rounded mb-2"></div>
                  <div className="h-8 w-1/2 bg-gray-900 rounded"></div>
                </li>
              ))}
            </>
          ) : (
            <div className="absolute inset-0 flex justify-center -translate-y-4 pointer-events-none">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-300"></div>
            </div>
          ))}

        {sortedItems.length === 0 ? (
          <div className="text-center">- No Results -</div>
        ) : (
          sortedItems.map((item, index) => <ItemCard item={item} key={item.id} session={session} isPriority={index <= 3} />)
        )}
      </ul>
    </div>
  )
}

export default ItemManager
