import { twMerge } from "tailwind-merge"

interface DateFieldProps {
  name: string
  value: string | null | undefined
  onChange: (value: string | null) => void
  label?: string
  id?: string
  title?: string
  disabled?: boolean
  wrapperClassName?: string
  labelClassName?: string
  inputClassName?: string
}

const DateField = ({
  name,
  value,
  onChange,
  label,
  id,
  title,
  disabled = false,
  wrapperClassName,
  labelClassName,
  inputClassName
}: DateFieldProps) => {
  const inputId = id ?? name
  const normalizedValue = value ?? ""

  return (
    <div className={twMerge("flex items-center gap-1 text-sm", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className={twMerge("text-gray-300 text-xs w-auto", labelClassName)}>
          {label}:
        </label>
      )}
      <div className="flex gap-1 text-xs whitespace-nowrap">
        <input
          id={inputId}
          type="date"
          name={name}
          value={normalizedValue}
          onChange={event => onChange(event.target.value || null)}
          disabled={disabled}
          title={title}
          className={twMerge(
            "border border-gray-300 bg-gray-900 px-1 text-sm font-normal scheme-dark",
            normalizedValue ? "text-white" : "text-gray-400",
            inputClassName
          )}
        />
        <button
          type="button"
          disabled={disabled || !normalizedValue}
          onClick={() => onChange(null)}
          className="rounded border border-gray-500 px-2 text-xs text-gray-200 hover-fine:outline-1 active:outline-1 disabled:opacity-40"
          title="Clear date"
        >
          X
        </button>
      </div>
    </div>
  )
}

export default DateField
