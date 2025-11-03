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
import ItemCardsSkeleton from "./ItemCardsSkeleton"
import LoadingSpinner from "./LoadingSpinner"

export type List = Database["public"]["Tables"]["lists"]["Row"]
export type Item = Database["public"]["Tables"]["items"]["Row"]
export type ListUser = Database["public"]["Tables"]["list_users"]["Row"]

export type LocalItem = Item & {
  signedUrl: string | null
  listName: string | null
}

function ItemManager({ session, onLogout }: { session: Session; onLogout: () => Promise<void> }) {
  const [filteredLists, setFilteredLists] = useState<(string | null)[]>([null])
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [followInputList, setFollowInputList] = useState(true)

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
    if (followInputList) {
      setFilteredLists([listId])
    }
  }

  const handleToggleFollowInputList = () => {
    setFollowInputList(prev => !prev)
    if (!followInputList) {
      setFilteredLists([selectedList])
    }
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
      <div className="flex justify-center items-center gap-1 border-2 ">
        <ListFilter
          filteredLists={filteredLists}
          onChange={setFilteredLists}
          selectedList={selectedList}
          userLists={userLists}
          followInputList={followInputList}
          onToggleFollowInputList={handleToggleFollowInputList}
        />
        <SortOrderSelect sortAsc={sortAsc} onChange={setSortAsc} />
      </div>

      <ul className="list-none p-0 relative">
        {loading &&
          (sortedItems.length === 0 ? (
            <>
              {console.log("Render: ItemCardsSkeleton")}
              <ItemCardsSkeleton />
            </>
          ) : (
            <>
              {console.log("Render: LoadingSpinner")}
              <LoadingSpinner />
              {sortedItems.map((item, index) => (
                <ItemCard item={item} key={item.id} session={session} isPriority={index <= 3} />
              ))}
            </>
          ))}

        {!loading &&
          (sortedItems.length === 0 ? (
            <>
              {console.log("Render: No Results")}
              <div className="text-center">- No Results -</div>
            </>
          ) : (
            <>
              {console.log("Render: ItemCards")}
              {sortedItems.map((item, index) => (
                <ItemCard item={item} key={item.id} session={session} isPriority={index <= 3} />
              ))}
            </>
          ))}
      </ul>
    </div>
  )
}

export default ItemManager
