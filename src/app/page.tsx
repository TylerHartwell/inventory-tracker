"use client"

import { useEffect, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import ItemManager from "@/features/items/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import Auth from "@/features/user/components/AuthForm"
import { validateSessionOrClear } from "@/features/user/utils/session/validateSessionOrClear"
import ErrorFallback from "@/shared/components/ErrorFallback"

function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()

        const validSession = await validateSessionOrClear(session)
        setSession(validSession)
      } catch (error) {
        console.error("Error fetching session:", error)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }
    getSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void (async () => {
        const validSession = await validateSessionOrClear(nextSession)
        setSession(validSession)
      })()
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
