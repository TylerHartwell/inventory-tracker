import { Session } from "@supabase/supabase-js"
import { ItemInput } from "./ItemInput"
import { ItemCard } from "./ItemCard"
import { useItemsRealtime } from "@/hooks/useItemsRealtime"
import { useEffect, useMemo, useState } from "react"
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
export type ListInvite = Database["public"]["Tables"]["list_invites"]["Row"]

export type LocalItem = Item & {
  signedUrl: string | null
  listName: string
}
export type LocalListInvite = ListInvite & {
  listName: string
}

export const nullListName = "Personal"

function ItemManager({ session, onLogout }: { session: Session; onLogout: () => Promise<void> }) {
  const [filteredListIds, setFilteredListIds] = useState<(string | null)[]>(() => {
    const saved = sessionStorage.getItem("filteredListIds")
    return saved ? JSON.parse(saved) : [null]
  })
  const [selectedList, setSelectedList] = useState<string | null>(() => {
    const saved = sessionStorage.getItem("selectedList")
    return saved ? JSON.parse(saved) : null
  })
  const [followInputList, setFollowInputList] = useState<boolean>(() => {
    const saved = sessionStorage.getItem("followInputList")
    return saved ? JSON.parse(saved) : true
  })
  const [sortAsc, setSortAsc] = useState<boolean>(() => {
    const saved = sessionStorage.getItem("sortAsc")
    return saved ? JSON.parse(saved) : false
  })
  const [showScrollTop, setShowScrollTop] = useState(false)
  const userLists = useUserLists(session.user.id)

  const { items, loading, refresh } = useItemsRealtime(session, filteredListIds)

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
      setFilteredListIds([listId])
    }
  }

  const handleToggleFollowInputList = () => {
    setFollowInputList(prev => !prev)
    if (!followInputList) {
      setFilteredListIds([selectedList])
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 10)
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    sessionStorage.setItem("filteredListIds", JSON.stringify(filteredListIds))
  }, [filteredListIds])

  useEffect(() => {
    sessionStorage.setItem("selectedList", JSON.stringify(selectedList))
  }, [selectedList])

  useEffect(() => {
    sessionStorage.setItem("followInputList", JSON.stringify(followInputList))
  }, [followInputList])

  useEffect(() => {
    sessionStorage.setItem("sortAsc", JSON.stringify(sortAsc))
  }, [sortAsc])

  useEffect(() => {
    sessionStorage.clear()
  }, [session.user.id])

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
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(min-content,25%)] justify-center items-center gap-1">
        <ListFilter
          filteredListIds={filteredListIds}
          onChange={setFilteredListIds}
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
            <ItemCardsSkeleton />
          ) : (
            <>
              <LoadingSpinner />
              {sortedItems.map((item, index) => (
                <ItemCard item={item} key={item.id} session={session} isPriority={index <= 3} />
              ))}
            </>
          ))}
        {!loading &&
          (sortedItems.length === 0 ? (
            <div className="text-center">- No Results -</div>
          ) : (
            <>
              {sortedItems.map((item, index) => (
                <ItemCard item={item} key={item.id} session={session} isPriority={index <= 3} />
              ))}
            </>
          ))}
        {sortedItems.length !== 0 && <div className="h-10  flex items-center justify-center">- End of Results -</div>}
      </ul>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-2 right-4 w-10 h-10 rounded-full shadow-lg border bg-white cursor-pointer text-black transition"
        >
          ↑
        </button>
      )}
    </div>
  )
}

export default ItemManager
