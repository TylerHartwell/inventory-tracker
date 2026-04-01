import { LocalItem } from "../ItemManager"
import ItemCardGridView from "./ItemCardGridView"
import ItemCardStackView from "./ItemCardStackView"

type ItemCardViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  isGridMode?: boolean
}

const ItemCardView = ({ viewItem, isPriority, isGridMode = false }: ItemCardViewProps) => {
  if (isGridMode) {
    return <ItemCardGridView viewItem={viewItem} isPriority={isPriority} />
  }

  return <ItemCardStackView viewItem={viewItem} isPriority={isPriority} />
}

export default ItemCardView
