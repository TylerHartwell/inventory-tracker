import { LocalItem } from "../ItemManager"
import { ItemCard } from "./ItemCard"
import ItemCardsSkeleton from "./ItemCardsSkeleton"
import LoadingSpinner from "./LoadingSpinner"

interface Props {
  loading: boolean
  sortedItems: LocalItem[]
  onDelete: (id: string) => void
}

const SortedItemResults = ({ loading, sortedItems, onDelete }: Props) => {
  return (
    <ul className="list-none p-0 relative">
      {loading &&
        (sortedItems.length === 0 ? (
          <ItemCardsSkeleton />
        ) : (
          <>
            <LoadingSpinner />
            {sortedItems.map((item, index) => (
              <ItemCard item={item} key={item.id} isPriority={index <= 3} onDelete={onDelete} />
            ))}
          </>
        ))}
      {!loading &&
        (sortedItems.length === 0 ? (
          <div className="text-center">- No Results -</div>
        ) : (
          <>
            {sortedItems.map((item, index) => (
              <ItemCard item={item} key={item.id} isPriority={index <= 3} onDelete={onDelete} />
            ))}
          </>
        ))}
      {sortedItems.length !== 0 && <div className="h-10 flex items-center text-center justify-center ">- End -</div>}
    </ul>
  )
}

export default SortedItemResults
