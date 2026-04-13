import { UserLists } from "@/hooks/useUserLists"
import { X } from "lucide-react"
import { ListFilter } from "./ListFilter"

export type ImageFilterMode = "with-images" | "without-images"
export type OptionalFilterType = "images"

type FilterSectionProps = {
  filteredListIds: (string | null)[]
  onFilteredListIdsChange: (lists: (string | null)[]) => void
  selectedListId: string | null
  userLists: UserLists
  followInputList: boolean
  onToggleFollowInputList: () => void
  optionalFilterType: OptionalFilterType | null
  onAddOptionalFilter: (filterType: OptionalFilterType) => void
  onRemoveOptionalFilter: () => void
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
  optionalFilterType,
  onAddOptionalFilter,
  onRemoveOptionalFilter,
  imageFilterMode,
  onImageFilterModeChange,
  useCompositiveFiltering,
  onUseCompositiveFilteringChange
}: FilterSectionProps) {
  return (
    <section className="rounded border border-gray-700 p-2 flex flex-col gap-2">
      <div className="text-sm font-medium">Filters</div>
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

        {optionalFilterType ? (
          <div className="relative rounded border border-gray-600 p-2 flex items-center gap-2 overflow-visible">
            <button
              type="button"
              onClick={() => onUseCompositiveFilteringChange(!useCompositiveFiltering)}
              className="flex items-center gap-1 text-xs font-semibold select-none cursor-pointer"
              title={useCompositiveFiltering ? "OR: items that match any active filter are included" : "AND: items must pass all active filters"}
            >
              <span className={`text-gray-300 transition-opacity ${!useCompositiveFiltering ? "opacity-100" : "opacity-30"}`}>AND</span>
              <span className="text-gray-500">/</span>
              <span className={`text-gray-300 transition-opacity ${useCompositiveFiltering ? "opacity-100" : "opacity-30"}`}>OR</span>
            </button>

            {optionalFilterType === "images" && (
              <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                Images:
                <select
                  value={imageFilterMode}
                  name="image-filter-mode"
                  onChange={e => onImageFilterModeChange(e.target.value as ImageFilterMode)}
                  className="h-7 rounded border border-gray-300 bg-black text-sm text-white"
                  title="Filter by image presence"
                >
                  <option value="with-images" className="bg-black text-white">
                    Present
                  </option>
                  <option value="without-images" className="bg-black text-white">
                    Absent
                  </option>
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={onRemoveOptionalFilter}
              className="absolute -right-2 -top-2 h-4 w-4 rounded-sm bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer"
              title="Remove filter"
              aria-label="Remove filter"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <select
            defaultValue=""
            onChange={e => {
              const nextFilterType = e.target.value as OptionalFilterType | ""
              if (!nextFilterType) return
              onAddOptionalFilter(nextFilterType)
            }}
            className="h-7 rounded border border-gray-300 bg-black text-sm text-white"
            title="Add one optional filter to combine with Lists"
          >
            <option value="" className="bg-black text-white">
              + Add Filter Type
            </option>
            <option value="images" className="bg-black text-white">
              Images
            </option>
          </select>
        )}
      </div>
    </section>
  )
}

export default FilterSection
