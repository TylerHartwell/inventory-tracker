import { useState, useEffect } from "react"
import { updateProfile } from "@/utils/updateProfile"
import { useUserProfile } from "@/hooks/useUserProfile"
import { Session } from "@supabase/supabase-js"

export function UsernameEditor({ session }: { session: Session }) {
  const { profile, setProfile, loading } = useUserProfile()
  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initialize input value when profile loads
  useEffect(() => {
    if (profile) setValue(profile.username ?? "")
  }, [profile])

  if (loading || !profile) return <div>Loading…</div>

  const hasChanged = value.trim() !== "" && value !== profile.username

  const handleSubmit = async () => {
    if (!hasChanged) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error } = await updateProfile({
      session: session,
      newUsername: value.trim()
    })

    if (error) {
      setError(error)
    } else {
      setProfile(prev => (prev ? { ...prev, username: value.trim() } : prev))
      setSuccess(true)
    }

    setSaving(false)
  }

  return (
    <div className="flex items-center justify-center outline-1 outline-gray-400 rounded-md">
      <label htmlFor="username" className="block text-sm font-medium">
        Username:
      </label>

      <input
        id="username"
        type="text"
        value={value}
        autoComplete="off"
        onChange={e => {
          setValue(e.target.value)
          setSuccess(false)
        }}
        placeholder="Enter your username"
        disabled={saving}
        className=" px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasChanged || saving}
        className={`
          px-2 py-1 rounded-md text-white font-medium
          ${hasChanged && !saving ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400 cursor-not-allowed"}
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        `}
      >
        {saving ? "Saving…" : "Change"}
      </button>

      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
      {success && <p className="text-green-600 mt-2 text-sm">Username updated</p>}
    </div>
  )
}
