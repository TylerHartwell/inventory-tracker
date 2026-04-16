const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

const parseDateOnlyAsLocal = (value: string): Date | null => {
  if (!DATE_ONLY_REGEX.test(value)) {
    return null
  }

  const [yearStr, monthStr, dayStr] = value.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  const parsed = new Date(year, month - 1, day)

  // Guard against invalid overflows like 2026-02-31.
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null
  }

  return parsed
}

export const formatDateOnly = (value: string): string => {
  const localDate = parseDateOnlyAsLocal(value)

  if (!localDate) {
    return value
  }

  return localDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit"
  })
}

export const getDateOnlySortValue = (value: string): number => {
  const localDate = parseDateOnlyAsLocal(value)

  if (localDate) {
    return localDate.getTime()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime()
}
