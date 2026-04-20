import { LocalItem } from "@/features/items/components/ItemManager"
import { VisibilityMode } from "@/shared/components/DisplaySection"
import ItemCardGridView from "./ItemCardGridView"
import ItemCardStackView from "./ItemCardStackView"

type ItemCardViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  isGridMode?: boolean
  visibilityMode: VisibilityMode
  useContainImageFit: boolean
}

const ItemCardView = ({ viewItem, isPriority, isGridMode = false, visibilityMode, useContainImageFit }: ItemCardViewProps) => {
  if (isGridMode) {
    return <ItemCardGridView viewItem={viewItem} isPriority={isPriority} visibilityMode={visibilityMode} useContainImageFit={useContainImageFit} />
  }

  return <ItemCardStackView viewItem={viewItem} isPriority={isPriority} visibilityMode={visibilityMode} useContainImageFit={useContainImageFit} />
}

export default ItemCardView
