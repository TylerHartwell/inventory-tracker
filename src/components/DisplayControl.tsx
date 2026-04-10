import { LayoutGrid, LayoutList } from "lucide-react"
import * as Switch from "@radix-ui/react-switch"

type DisplayMode = "stack" | "grid"
type GridColumns = 1 | 2 | 3 | 4

type DisplayControlProps = {
  displayMode: DisplayMode
  gridColumns: GridColumns
  useContainImageFit: boolean
  onDisplayModeChange: (mode: DisplayMode) => void
  onGridColumnsChange: (cols: GridColumns) => void
  onUseContainImageFitChange: (value: boolean) => void
}

function DisplayControl({
  displayMode,
  gridColumns,
  useContainImageFit,
  onDisplayModeChange,
  onGridColumnsChange,
  onUseContainImageFitChange
}: DisplayControlProps) {
  return (
    <div className=" rounded flex items-center gap-2 text-sm">
      <label className="flex items-center gap-1 pl-2">
        Display
        <span aria-hidden="true" className="text-gray-600">
          {displayMode === "grid" ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
        </span>
        <select
          value={displayMode}
          name="display-mode"
          onChange={e => onDisplayModeChange(e.target.value as DisplayMode)}
          className="h-7 rounded border border-gray-300 bg-black  text-sm text-white"
          title="Display mode"
        >
          <option value="stack" className="bg-black text-white">
            Stack
          </option>
          <option value="grid" className="bg-black text-white">
            Grid
          </option>
        </select>
      </label>
      {displayMode === "grid" && (
        <label className="text-xs text-gray-600 flex items-center gap-1">
          Cols
          <select
            value={gridColumns}
            name="grid-cols"
            onChange={e => onGridColumnsChange(Number(e.target.value) as GridColumns)}
            className="h-7 rounded border border-gray-300 bg-black text-sm text-white"
            title="Grid columns"
          >
            <option value={1} className="bg-black text-white">
              1
            </option>
            <option value={2} className="bg-black text-white">
              2
            </option>
            <option value={3} className="bg-black text-white">
              3
            </option>
            <option value={4} className="bg-black text-white">
              4
            </option>
          </select>
        </label>
      )}
      <label className="flex gap-1 flex-wrap items-center justify-center cursor-pointer ml-auto pr-2">
        <span className="text-xs select-none text-center text-gray-300">Fit Full Image</span>
        <Switch.Root
          id="use-contain-image-fit"
          checked={useContainImageFit}
          onCheckedChange={onUseContainImageFitChange}
          className="group w-10 h-5 rounded-full border-2 border-gray-400 bg-gray-400 relative data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 flex items-center justify-between cursor-pointer"
          title={useContainImageFit ? "Contain fit enabled - toggle to use cover" : "Cover fit enabled - toggle to use contain"}
        >
          <Switch.Thumb className="h-full aspect-square inline-block rounded-full bg-white transition-transform duration-300 ease-in-out translate-x-0 data-[state=checked]:translate-x-5" />
          <span className="h-full text-[8px] leading-none grow flex items-center justify-center transition-transform duration-300 ease-in-out translate-y-[0.5px] translate-x-0 group-data-[state=checked]:-translate-x-4 text-black">
            {useContainImageFit ? "ON" : "OFF"}
          </span>
        </Switch.Root>
      </label>
    </div>
  )
}

export default DisplayControl
