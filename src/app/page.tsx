"use client"

import { useEffect, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import ItemManager from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import Auth from "@/components/AuthForm"

// Fallback component for errors
function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
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
      >
        Reload Page
      </button>
    </div>
  )
}

function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        setSession(session)
      } catch (error) {
        console.error("Error fetching session:", error)
      } finally {
        setLoading(false)
      }
    }
    getSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log errors (can integrate with Sentry, LogRocket, etc.)
        if (process.env.NODE_ENV === "development") {
          console.error("ErrorBoundary caught an error:", error, errorInfo)
        }
      }}
    >
      {loading ? (
        <div className="flex h-screen items-center justify-center text-lg">Loading...</div>
      ) : (
        <>
          {session ? (
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              resetKeys={[session.user.id]}
              onError={(error, errorInfo) => {
                if (process.env.NODE_ENV === "development") {
                  console.error("ErrorBoundary caught an error:", error, errorInfo)
                }
              }}
            >
              <ItemManager session={session} onLogout={handleLogout} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onError={(error, errorInfo) => {
                if (process.env.NODE_ENV === "development") {
                  console.error("ErrorBoundary caught an error:", error, errorInfo)
                }
              }}
            >
              <Auth />
            </ErrorBoundary>
          )}
        </>
      )}
    </ErrorBoundary>
  )
}

export default Home
