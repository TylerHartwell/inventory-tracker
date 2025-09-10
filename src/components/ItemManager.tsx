import { Session } from "@supabase/supabase-js"
import { ItemInput } from "./ItemInput"
import { ItemCard } from "./ItemCard"
import { useItemsRealtime } from "@/hooks/useItemsRealtime"

export interface Item {
  id: string
  itemName: string
  extraDetails: string
  created_at: string
  image_url: string | null
  signedUrl: string | null
}

function ItemManager({ session }: { session: Session }) {
  const { items, loading, refresh } = useItemsRealtime(session)

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Item Manager CRUD</h2>
      <ItemInput session={session} refresh={refresh} />
      <ul className="list-none p-0">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="border border-gray-300 rounded p-4 mb-2 animate-pulse">
                <div className="h-8 w-3/4 bg-gray-900 rounded mb-2"></div>
                <div className="h-8 w-1/2 bg-gray-900 rounded"></div>
              </li>
            ))
          : items.map((item, index) => <ItemCard item={item} key={item.id} session={session} isPriority={index <= 3} />)}
      </ul>
    </div>
  )
}

export default ItemManager
