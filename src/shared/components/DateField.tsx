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
  const resolvedWrapperClassName = wrapperClassName ?? " flex items-center gap-1 text-sm"
  const resolvedLabelClassName = labelClassName ?? "text-gray-300 w-min sm:w-auto"
  const resolvedInputClassName = [
    "border border-gray-300 bg-gray-900 px-1 text-sm font-normal scheme-dark",
    normalizedValue ? "text-white" : "text-gray-400",
    inputClassName
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={resolvedWrapperClassName}>
      {label && (
        <label htmlFor={inputId} className={resolvedLabelClassName}>
          {label}:
        </label>
      )}
      <div className="flex gap-1 overflow-x-auto text-xs whitespace-nowrap">
        <input
          id={inputId}
          type="date"
          name={name}
          value={normalizedValue}
          onChange={event => onChange(event.target.value || null)}
          disabled={disabled}
          title={title}
          className={resolvedInputClassName}
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
