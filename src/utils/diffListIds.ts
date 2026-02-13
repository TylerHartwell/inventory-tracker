export const diffListIds = (prev: (string | null)[], next: (string | null)[]) => {
  const prevSet = new Set(prev)
  const nextSet = new Set(next)
  const added = next.filter(id => !prevSet.has(id))
  const removed = prev.filter(id => !nextSet.has(id))

  return { added, removed }
}
