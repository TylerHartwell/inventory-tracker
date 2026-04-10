import { LocalItem } from "../ItemManager"
import ItemCardGridView from "./ItemCardGridView"
import ItemCardStackView from "./ItemCardStackView"

type ItemCardViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  isGridMode?: boolean
  useContainImageFit: boolean
}

const ItemCardView = ({ viewItem, isPriority, isGridMode = false, useContainImageFit }: ItemCardViewProps) => {
  if (isGridMode) {
    return <ItemCardGridView viewItem={viewItem} isPriority={isPriority} useContainImageFit={useContainImageFit} />
  }

  return <ItemCardStackView viewItem={viewItem} isPriority={isPriority} useContainImageFit={useContainImageFit} />
}

export default ItemCardView
