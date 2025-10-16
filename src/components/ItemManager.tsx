import { Session } from "@supabase/supabase-js"
import { ItemInput } from "./ItemInput"
import { ItemCard } from "./ItemCard"
import { useItemsRealtime } from "@/hooks/useItemsRealtime"
import { useState } from "react"
import { SortOrderSelect } from "./SortOrderSelect"
import { ListFilter } from "./ListFilter"
import { Database } from "@/types/supabase"

export type List = Database["public"]["Tables"]["lists"]["Row"]
export type Item = Database["public"]["Tables"]["items"]["Row"]

export type LocalItem = Item & {
  signedUrl: string | null
}

function ItemManager({ session, logout }: { session: Session; logout: () => Promise<void> }) {
  const [filteredLists, setFilteredLists] = useState<(string | null)[]>([null])
  const [selectedList, setSelectedList] = useState<string | null>(null)

  const { items, loading, refresh } = useItemsRealtime(session, filteredLists)
  const [sortAsc, setSortAsc] = useState(false)

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return sortAsc ? timeA - timeB : timeB - timeA
  })

  return (
    <div className="max-w-xl mx-auto p-2 flex flex-col gap-2 ">
      <div className="flex justify-between items-baseline">
        <h2 className="text-2xl font-semibold">Inventory Tracker</h2>
        <span className="flex items-baseline gap-4">
          <span>{session.user.email}</span>
          <button onClick={logout} className="rounded-lg bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600 transition-colors">
            Log Out
          </button>
        </span>
      </div>

      <ItemInput session={session} refresh={refresh} selectedList={selectedList} onListChange={setSelectedList} />
      <div className="flex justify-end items-start gap-2">
        <ListFilter userId={session.user.id} filteredLists={filteredLists} onChange={setFilteredLists} />
        <SortOrderSelect sortAsc={sortAsc} onChange={setSortAsc} />
      </div>

      <ul className="list-none p-0">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="border border-gray-300 rounded p-4 mb-2 animate-pulse">
                <div className="h-8 w-3/4 bg-gray-900 rounded mb-2"></div>
                <div className="h-8 w-1/2 bg-gray-900 rounded"></div>
              </li>
            ))
          : sortedItems.map((item, index) => <ItemCard item={item} key={item.id} session={session} isPriority={index <= 3} />)}
      </ul>
    </div>
  )
}

export default ItemManager
