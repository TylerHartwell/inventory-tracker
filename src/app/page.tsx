"use client"

import { useEffect, useState } from "react"

import ItemManager from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import Auth from "@/components/AuthForm"

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

  return loading ? (
    <div className="flex h-screen items-center justify-center text-lg">Loading...</div>
  ) : (
    <>
      {session ? (
        <>
          <ItemManager session={session} onLogout={handleLogout} />
        </>
      ) : (
        <Auth />
      )}
    </>
  )
}

export default Home
