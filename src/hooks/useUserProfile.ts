import { supabase } from "@/supabase-client"
import { Dispatch, SetStateAction, useEffect, useState } from "react"

export type UserProfileData = {
  username: string | null
  email: string
}
export interface UserProfile {
  profile: UserProfileData | null
  loading: boolean
  setProfile: Dispatch<SetStateAction<UserProfileData | null>>
}

export function useUserProfile() {
  const [profile, setProfile] = useState<{ username: string | null; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()

      setProfile({ username: profile?.username ?? null, email: user.email ?? "" })
      setLoading(false)
    }
    fetchProfile()
  }, [])

  return { profile, loading, setProfile }
}
