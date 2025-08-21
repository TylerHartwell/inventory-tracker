"use client"

import { useEffect, useState } from "react"
import { Auth } from "../components/auth"
import TaskManager from "../components/TaskManager"
import { supabase } from "../supabase-client"
import { Session } from "@supabase/supabase-js"

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

  const logout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return <div>Loading...</div>

  return (
    <>
      {session ? (
        <>
          <button onClick={logout} className="mb-4 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition-colors">
            Log Out
          </button>
          <TaskManager session={session} />
        </>
      ) : (
        <Auth />
      )}
    </>
  )
}

export default Home
