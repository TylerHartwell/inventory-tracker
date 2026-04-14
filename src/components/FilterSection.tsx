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
  onImageFilterModeChange
}: FilterSectionProps) {
  return (
    <section className="rounded border border-gray-700 p-2 flex flex-col gap-2">
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex items-end justify-between gap-3 min-w-0">
          <h2 className="text-sm font-medium border-b border-r rounded border-gray-600 w-min pr-2 pb-1">Filters</h2>
          <select
            name="add-filter-type"
            value=""
            onChange={e => {
              const nextFilterType = e.target.value as OptionalFilterType | ""
              if (!nextFilterType) return
              if (optionalFilterType === nextFilterType) return
              onAddOptionalFilter(nextFilterType)
            }}
            className="h-7 rounded border border-gray-300 bg-black text-sm text-white"
            title="Add one optional filter to combine with Lists"
          >
            <option value="" className="bg-black text-white">
              + Add Filter Type
            </option>
            {optionalFilterType !== "images" && (
              <option value="images" className="bg-black text-white">
                Images
              </option>
            )}
          </select>
        </div>

        <div className="min-w-0">
          <ListFilter
            filteredListIds={filteredListIds}
            onChange={onFilteredListIdsChange}
            selectedListId={selectedListId}
            userLists={userLists}
            followInputList={followInputList}
            onToggleFollowInputList={onToggleFollowInputList}
          />
        </div>

        {optionalFilterType && (
          <div className="flex w-min items-center gap-2">
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
              className="h-5 w-5 rounded-sm bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer"
              title="Remove filter"
              aria-label="Remove filter"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default FilterSection
