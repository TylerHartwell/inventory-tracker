import { UserLists } from "@/hooks/useUserLists"
import * as Switch from "@radix-ui/react-switch"
import { ListFilter } from "./ListFilter"

export type ImageFilterMode = "all" | "with-images" | "without-images"

type FilterSectionProps = {
  filteredListIds: (string | null)[]
  onFilteredListIdsChange: (lists: (string | null)[]) => void
  selectedListId: string | null
  userLists: UserLists
  followInputList: boolean
  onToggleFollowInputList: () => void
  imageFilterMode: ImageFilterMode
  onImageFilterModeChange: (mode: ImageFilterMode) => void
  useCompositiveFiltering: boolean
  onUseCompositiveFilteringChange: (value: boolean) => void
}

function FilterSection({
  filteredListIds,
  onFilteredListIdsChange,
  selectedListId,
  userLists,
  followInputList,
  onToggleFollowInputList,
  imageFilterMode,
  onImageFilterModeChange,
  useCompositiveFiltering,
  onUseCompositiveFilteringChange
}: FilterSectionProps) {
  return (
    <section className="rounded border border-gray-700 p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Filters</div>
        <label className="flex gap-1 flex-wrap items-center justify-start cursor-pointer">
          <span className="text-xs select-none text-center">Compositive Filter Behavior</span>
          <Switch.Root
            id="compositive-filtering"
            checked={useCompositiveFiltering}
            onCheckedChange={onUseCompositiveFilteringChange}
            className="group w-10 h-5 rounded-full border-2 border-gray-400 bg-gray-400 relative data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 flex items-center justify-between cursor-pointer"
            title={
              useCompositiveFiltering
                ? "Compositive behavior enabled: items that match any active filter are included."
                : "Compositive behavior disabled: items must pass all active filters."
            }
          >
            <Switch.Thumb
              className="h-full aspect-square inline-block rounded-full bg-white transition-transform duration-300 ease-in-out
        translate-x-0 data-[state=checked]:translate-x-5 "
            />
            <span
              className="h-full text-[8px] leading-none grow flex items-center justify-center transition-transform duration-300 ease-in-out
        translate-y-[0.5px] translate-x-0 group-data-[state=checked]:-translate-x-4 "
            >
              {useCompositiveFiltering ? "ON" : "OFF"}
            </span>
          </Switch.Root>
        </label>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <ListFilter
            filteredListIds={filteredListIds}
            onChange={onFilteredListIdsChange}
            selectedListId={selectedListId}
            userLists={userLists}
            followInputList={followInputList}
            onToggleFollowInputList={onToggleFollowInputList}
          />
        </div>
        <span className="text-xs font-semibold text-gray-400 select-none">{useCompositiveFiltering ? "OR" : "AND"}</span>
        <label className="flex items-center gap-1 text-sm whitespace-nowrap">
          Images:
          <select
            value={imageFilterMode}
            name="image-filter-mode"
            onChange={e => onImageFilterModeChange(e.target.value as ImageFilterMode)}
            className="h-7 rounded border border-gray-300 bg-black text-sm text-white"
            title="Filter by image presence"
          >
            <option value="all" className="bg-black text-white">
              All
            </option>
            <option value="with-images" className="bg-black text-white">
              With Images
            </option>
            <option value="without-images" className="bg-black text-white">
              No Images
            </option>
          </select>
        </label>
      </div>
    </section>
  )
}

export default FilterSection
