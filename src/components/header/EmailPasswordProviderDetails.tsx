import { supabase } from "@/supabase-client"
import { UserAttributes } from "@supabase/supabase-js"
import { SubmitEventHandler, useEffect, useEffectEvent, useState } from "react"

interface EmailPasswordProviderDetailsProps {
  userEmail: string
  onErrorMessage: (text: string | null) => void
}

export function EmailPasswordProviderDetails({ userEmail, onErrorMessage }: EmailPasswordProviderDetailsProps) {
  const [passwordChangeFormVisible, setPasswordChangeFormVisible] = useState(false)
  const [passwordSetupFormVisible, setPasswordSetupFormVisible] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const [linked, setLinked] = useState(false)
  const [loading, setLoading] = useState(true)

  const onErrorMessageEvent = useEffectEvent((error: string | null) => {
    onErrorMessage(error)
  })

  useEffect(() => {
    const refreshLinkedStatus = async () => {
      setLoading(true)

      try {
        const { data: identitiesData, error } = await supabase.auth.getUserIdentities()

        if (error || !identitiesData) {
          throw new Error(error?.message || "Failed to fetch user identities.")
        }

        const emailIdentity = identitiesData.identities.find(identity => identity.provider === "email")

        setLinked(!!emailIdentity)
      } catch (error) {
        onErrorMessageEvent(error instanceof Error ? error.message : "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    refreshLinkedStatus()
  }, [])

  const handlePasswordChangeSubmit: SubmitEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    setLoading(true)
    const attributes: UserAttributes = { password: newPassword }

    try {
      const { error } = await supabase.auth.updateUser(attributes)

      if (error) {
        throw new Error(error.message)
      }

      setPasswordChangeFormVisible(false)
      setNewPassword("")
    } catch (error) {
      onErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSetupSubmit: SubmitEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    setLoading(true)
    const attributes: UserAttributes = newEmail ? { email: newEmail, password: newPassword } : { password: newPassword }

    try {
      const { error } = await supabase.auth.updateUser(attributes)

      if (error) {
        throw new Error(error.message)
      }

      setPasswordSetupFormVisible(false)
      setNewPassword("")
      setNewEmail("")
    } catch (error) {
      onErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-400 rounded p-2 flex flex-col gap-1.5">
      {!linked ? (
        !passwordSetupFormVisible ? (
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setPasswordSetupFormVisible(true)}
            disabled={loading}
          >
            Set up password
          </button>
        ) : (
          <form onSubmit={handlePasswordSetupSubmit} className="flex flex-col gap-1.5">
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              value={userEmail ?? newEmail}
              disabled={!!userEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Create password"
              value={newPassword}
              minLength={8}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="p-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button type="submit" className="text-sm text-blue-600 hover:underline" disabled={loading || !newPassword}>
              Save password
            </button>
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => {
                setPasswordSetupFormVisible(false)
                setNewPassword("")
                setNewEmail("")
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </form>
        )
      ) : !passwordChangeFormVisible ? (
        <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setPasswordChangeFormVisible(true)}>
          Change password
        </button>
      ) : (
        <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-1.5">
          <input
            type="password"
            placeholder="New password (min. 8 characters)"
            value={newPassword}
            minLength={8}
            onChange={e => {
              setNewPassword(e.target.value)
              onErrorMessage(null)
            }}
            autoComplete="new-password"
            className="p-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newPassword || loading}
              className="flex-1 rounded-md py-1 bg-blue-600 text-white text-xs font-medium disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setPasswordChangeFormVisible(false)
                setNewPassword("")
                onErrorMessage(null)
              }}
              disabled={loading}
              className="flex-1 rounded-md py-1 bg-gray-200 text-gray-700 text-xs font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
