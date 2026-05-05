import { supabase } from "@/supabase-client"
import { Dispatch, SetStateAction, useEffect, useState } from "react"

export type UserProfileData = {
  userId: string
  username: string | null
  email: string | null
}
export interface UserProfile {
  profile: UserProfileData | null
  loading: boolean
  setProfile: Dispatch<SetStateAction<UserProfileData | null>>
}

export function useUserProfile(userId: string, userEmail: string | null) {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)

      const { data: selectedProfile, error: selectProfileError } = await supabase.from("profiles").select("username").eq("id", userId).single()

      if (selectProfileError || !selectedProfile) {
        console.error("Error fetching profile:", selectProfileError)
        setLoading(false)
        return
      }

      setProfile({ userId, username: selectedProfile.username, email: userEmail })
      setLoading(false)
    }

    fetchProfile()
  }, [userEmail, userId])

  return { profile, loading, setProfile }
}
