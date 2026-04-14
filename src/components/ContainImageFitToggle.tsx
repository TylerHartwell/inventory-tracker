import * as Switch from "@radix-ui/react-switch"

type ContainImageFitToggleProps = {
  useContainImageFit: boolean
  onUseContainImageFitChange: (value: boolean) => void
  className?: string
  id?: string
}

const ContainImageFitToggle = ({ useContainImageFit, onUseContainImageFitChange, className, id }: ContainImageFitToggleProps) => {
  return (
    <label className={`flex gap-1 items-center justify-end cursor-pointer${className ?? ""}`}>
      <span className="text-xs select-none text-nowrap text-center text-gray-300">Contain Full Image</span>
      <Switch.Root
        id={id}
        checked={useContainImageFit}
        onCheckedChange={onUseContainImageFitChange}
        aria-label={useContainImageFit ? "Image fit: contain" : "Image fit: cover"}
        className="group w-10 h-5 rounded-full border-2 border-gray-400 bg-gray-400 relative data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 flex items-center justify-between cursor-pointer"
        title={useContainImageFit ? "Contain fit enabled - toggle to use cover" : "Cover fit enabled - toggle to use contain"}
      >
        <Switch.Thumb className="h-full aspect-square inline-block rounded-full bg-white transition-transform duration-300 ease-in-out translate-x-0 data-[state=checked]:translate-x-5" />
        <span className="h-full text-[8px] leading-none grow flex items-center justify-center transition-transform duration-300 ease-in-out translate-y-[0.5px] translate-x-0 group-data-[state=checked]:-translate-x-4 text-black">
          {useContainImageFit ? "ON" : "OFF"}
        </span>
      </Switch.Root>
    </label>
  )
}

export default ContainImageFitToggle
