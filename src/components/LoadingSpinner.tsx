const LoadingSpinner = () => {
  return (
    <div className="absolute inset-0 flex justify-center -translate-y-4 pointer-events-none z-10">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-300"></div>
    </div>
  )
}

export default LoadingSpinner
