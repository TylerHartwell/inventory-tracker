import { useState, useRef, useCallback } from "react"
import { updateProfile } from "@/features/user/utils/profile/updateProfile"
import { UserProfile } from "@/features/user/hooks/useUserProfile"
import { Pencil, Check, X } from "lucide-react"
import { useMinDurationActive } from "@/shared/hooks/useMinDurationActive"

export function UsernameEditor({ userProfile }: { userProfile: UserProfile }) {
  const { profile, setProfile, loading } = userProfile
  const [localUsername, setLocalUsername] = useState(profile?.username ?? "")
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFinishSaving = useCallback(() => {
    setProfile(prev => (prev ? { ...prev, username: localUsername.trim() } : prev))
  }, [localUsername, setProfile])

  const spinning = useMinDurationActive(saving, 300, handleFinishSaving)

  if (loading || !profile) return <div>Loading…</div>

  const isBlank = localUsername.trim() === ""

  const focusInput = () => {
    inputRef.current?.focus()
  }
  const handleCancel = () => {
    setEditing(false)
    setError(null)
    setLocalUsername(profile.username ?? "")
  }

  const handleSubmit = async () => {
    const trimmedUsername = localUsername.trim()

    if (!trimmedUsername) {
      setError("Username cannot be empty.")
      focusInput()
      return
    }

    if (trimmedUsername === (profile.username ?? "")) {
      setError("Username is unchanged.")
      focusInput()
      return
    }

    setSaving(true)
    setError(null)

    const { error } = await updateProfile({
      newUsername: trimmedUsername,
      userId: profile.userId
    })

    if (error) {
      setError(error)
      focusInput()
    } else {
      setEditing(false)
    }

    setSaving(false)
  }

  const hasPersistedUsername = Boolean(profile.username?.trim())
  const showForm = !hasPersistedUsername || editing || spinning

  return (
    <div className="flex flex-col gap-1 rounded-md px-1 relative ">
      {!hasPersistedUsername && (
        <span className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-1.75 h-1.75 bg-red-500 rounded-full border border-white"></span>
      )}
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
            onChange={e => {
              setLocalUsername(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Enter new username"
            disabled={spinning}
            className="px-1 -ml-1.25  border border-gray-300 rounded-md shadow-sm  disabled:bg-gray-800 disabled:cursor-not-allowed w-full min-w-0"
          />

          <button
            type="submit"
            disabled={spinning}
            className={`px-2 py-1 rounded-md border border-gray-400 text-white font-medium focus:outline-none focus:ring-1 ${
              !isBlank && !spinning ? "bg-green-500 hover:bg-green-400" : "bg-gray-500 cursor-not-allowed"
            } `}
            title="Save username"
          >
            <Check />
          </button>
          <button
            type="button"
            disabled={spinning}
            name="cancel"
            onClick={handleCancel}
            className={`px-2 py-1 rounded-md border border-gray-400 text-white font-medium focus:outline-none focus:ring-1 ${
              !spinning ? "bg-gray-800 hover:bg-gray-600" : "bg-gray-700 cursor-not-allowed"
            } `}
            title="Cancel"
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
            title="Edit username"
          >
            <Pencil />
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}
