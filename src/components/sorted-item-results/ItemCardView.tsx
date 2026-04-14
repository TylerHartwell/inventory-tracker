import { LocalItem } from "../ItemManager"
import { ImageDisplayMode } from "../DisplaySection"
import ItemCardGridView from "./ItemCardGridView"
import ItemCardStackView from "./ItemCardStackView"

type ItemCardViewProps = {
  viewItem: LocalItem
  isPriority?: boolean
  isGridMode?: boolean
  imageDisplayMode: ImageDisplayMode
  useContainImageFit: boolean
}

const ItemCardView = ({ viewItem, isPriority, isGridMode = false, imageDisplayMode, useContainImageFit }: ItemCardViewProps) => {
  if (isGridMode) {
    return (
      <ItemCardGridView viewItem={viewItem} isPriority={isPriority} imageDisplayMode={imageDisplayMode} useContainImageFit={useContainImageFit} />
    )
  }

  return <ItemCardStackView viewItem={viewItem} isPriority={isPriority} imageDisplayMode={imageDisplayMode} useContainImageFit={useContainImageFit} />
}

export default ItemCardView
