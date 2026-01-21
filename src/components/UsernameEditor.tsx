import { useState, useEffect, useRef } from "react"
import { updateProfile } from "@/utils/updateProfile"
import { UserProfile } from "@/hooks/useUserProfile"
import { Session } from "@supabase/supabase-js"
import { Pencil, Check, X } from "lucide-react"
import { useMinDurationSpin } from "@/hooks/useMinDurationSpin"

export function UsernameEditor({ session, userProfile }: { session: Session; userProfile: UserProfile }) {
  const { profile, setProfile, loading } = userProfile
  const [localUsername, setLocalUsername] = useState(profile?.username ?? "")
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFinish = () => {
    setProfile(prev => (prev ? { ...prev, username: localUsername.trim() } : prev))
  }

  const spinning = useMinDurationSpin(saving, 300, onFinish)

  // Initialize username when profile loads
  useEffect(() => {
    setLocalUsername(profile?.username ?? "")
  }, [profile?.username])

  if (loading || !profile) return <div>Loading…</div>

  const hasChanged = localUsername.trim() !== "" && localUsername !== profile.username

  const focusInput = () => {
    inputRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!hasChanged) return

    setSaving(true)
    setError(null)

    const { error } = await updateProfile({
      session: session,
      newUsername: localUsername.trim()
    })

    if (error) {
      setError(error)
      focusInput()
    } else {
      setEditing(false)
    }

    setSaving(false)
  }

  const showForm = !localUsername || editing || spinning

  return (
    <div className="flex flex-col gap-1 rounded-md px-1">
      {showForm ? (
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex items-center gap-1 w-full"
        >
          <label htmlFor="username" className="text-sm font-medium">
            Username:
          </label>
          <input
            id="username"
            type="text"
            name="username"
            autoFocus
            ref={inputRef}
            value={localUsername}
            autoComplete="off"
            onChange={e => setLocalUsername(e.target.value)}
            placeholder="Enter new username"
            disabled={spinning}
            className="px-1 -ml-1.25  border border-gray-300 rounded-md shadow-sm  disabled:bg-gray-800 disabled:cursor-not-allowed w-full min-w-0"
          />

          <button
            type="submit"
            disabled={!hasChanged || spinning}
            className={`px-2 py-1 rounded-md border border-gray-400 text-white font-medium focus:outline-none focus:ring-1 ${
              hasChanged && !spinning ? "bg-green-500 hover:bg-green-400" : "bg-gray-500 cursor-not-allowed"
            } `}
          >
            <Check />
          </button>
          <button
            type="button"
            disabled={spinning}
            name="cancel"
            onClick={() => {
              setEditing(false)
              setError(null)
              setLocalUsername(profile.username ?? "")
            }}
            className={`px-2 py-1 rounded-md border border-gray-400 text-white font-medium focus:outline-none focus:ring-1 ${
              !spinning ? "bg-gray-800 hover:bg-gray-600" : "bg-gray-700 cursor-not-allowed"
            } `}
          >
            <X />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1 w-full">
          <span className="text-sm font-medium">Username:</span>
          <span className="w-full">{localUsername}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-2 py-1 rounded-md border border-gray-400 text-white font-medium hover:bg-gray-500 focus:outline-none focus:ring-1"
          >
            <Pencil />
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}
