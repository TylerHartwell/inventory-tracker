const ItemCardsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="border border-gray-300 rounded-2xl p-4 mb-2 animate-pulse">
          <div className="h-8 w-3/4 bg-gray-900 rounded mb-2"></div>
          <div className="h-8 w-1/2 bg-gray-900 rounded"></div>
        </li>
      ))}
    </>
  )
}

export default ItemCardsSkeleton
