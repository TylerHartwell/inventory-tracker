import { FallbackProps } from "react-error-boundary"

export default function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-gray-600 mb-4">{errorMessage}</p>
      <button
        onClick={() => {
          resetErrorBoundary()
          window.location.reload()
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        title="Reload the page to recover from the error"
      >
        Reload Page
      </button>
    </div>
  )
}
