import { useEffect, useState } from "react"
import { X, RefreshCw } from "lucide-react"
import { InvitesList } from "./InvitesList"
import { InviteWithListName } from "@/hooks/useUserInvites"
import { UsernameEditor } from "./UsernameEditor"
import { useMinDurationActive } from "@/hooks/useMinDurationActive"
import { UserProfile } from "@/hooks/useUserProfile"
import { supabase } from "@/supabase-client"

type OAuthProvider = "google"

interface UserSettingsProps {
  onLogout: () => Promise<void>
  onClose: () => void
  invitesState: {
    invites: InviteWithListName[]
    loading: boolean
    error: string | null
    refreshInvites: () => Promise<{ data: null; error: string | null }>
  }
  userProfile: UserProfile
}

const UserSettings = ({ onLogout, onClose, invitesState, userProfile }: UserSettingsProps) => {
  const { loading, refreshInvites } = invitesState
  const [linkedProviders, setLinkedProviders] = useState<Record<OAuthProvider, boolean>>({ google: false })
  const [identityCount, setIdentityCount] = useState(0)
  const [linkLoadingProvider, setLinkLoadingProvider] = useState<OAuthProvider | null>(null)
  const [identitiesLoading, setIdentitiesLoading] = useState(false)
  const [linkMessage, setLinkMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const spinning = useMinDurationActive(loading, 300)

  const hasInvites = invitesState.invites.length > 0

  const loadLinkedProviders = async () => {
    setIdentitiesLoading(true)

    const { data, error } = await supabase.auth.getUserIdentities()

    if (error) {
      setLinkMessage({ type: "error", text: error.message })
      setIdentitiesLoading(false)
      return
    }

    const identities = data?.identities ?? []
    const providers = new Set(identities.map(identity => identity.provider).filter(Boolean))

    setIdentityCount(identities.length)

    setLinkedProviders({
      google: providers.has("google")
    })

    setIdentitiesLoading(false)
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLinkedProviders()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const handleLinkProvider = async (provider: OAuthProvider) => {
    if (linkedProviders[provider]) {
      return
    }

    setLinkLoadingProvider(provider)
    setLinkMessage(null)

    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      setLinkMessage({ type: "error", text: error.message })
      setLinkLoadingProvider(null)
      return
    }

    setLinkMessage({ type: "success", text: "Redirecting to Google to link your account..." })
  }

  const handleUnlinkGoogle = async () => {
    const confirmed = window.confirm("Unlink Google sign-in from this account?")
    if (!confirmed) return

    setLinkLoadingProvider("google")
    setLinkMessage(null)

    const { data, error: identitiesError } = await supabase.auth.getUserIdentities()

    if (identitiesError) {
      setLinkMessage({ type: "error", text: identitiesError.message })
      setLinkLoadingProvider(null)
      return
    }

    const identities = data?.identities ?? []

    if (identities.length <= 1) {
      setLinkMessage({
        type: "error",
        text: "Cannot unlink Google because it is your only sign-in method. Add another method first."
      })
      setLinkLoadingProvider(null)
      return
    }

    const googleIdentity = identities.find(identity => identity.provider === "google")

    if (!googleIdentity) {
      setLinkMessage({ type: "error", text: "Google is not currently linked to this account." })
      setLinkLoadingProvider(null)
      return
    }

    const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity)

    if (unlinkError) {
      setLinkMessage({ type: "error", text: unlinkError.message })
      setLinkLoadingProvider(null)
      return
    }

    await loadLinkedProviders()
    setLinkLoadingProvider(null)
    setLinkMessage({ type: "success", text: "Google sign-in has been unlinked." })
  }

  const canUnlinkGoogle = linkedProviders.google && identityCount > 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-sm rounded-xl bg-gray-700 p-3 shadow-lg flex flex-col gap-2" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <span>User Settings</span>
          <button
            onClick={() => onClose()}
            className="size-5 hover:bg-gray-500 text-center flex items-center justify-center transition cursor-pointer"
          >
            <X />
          </button>
        </div>
        <UsernameEditor userProfile={userProfile} />

        <div className="border border-gray-400 rounded-md p-1.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-center relative">
            <span className="text-sm font-medium">Linked Sign-In Methods</span>
            {identitiesLoading && <RefreshCw size={14} className="absolute right-0 animate-spin [animation-duration:600ms]" />}
          </div>

          <div className="flex items-center justify-center gap-0.5 flex-wrap">
            <div className=" px-1 py-1 text-xs">Google:</div>
            {!linkedProviders.google ? (
              <button
                onClick={() => void handleLinkProvider("google")}
                className="rounded-md bg-white text-black px-2 py-1 text-xs font-medium disabled:opacity-50"
                disabled={identitiesLoading || linkLoadingProvider !== null}
              >
                Link
              </button>
            ) : (
              <button
                onClick={() => void handleUnlinkGoogle()}
                className="rounded-md bg-gray-600 text-white px-2 py-1 text-xs disabled:opacity-50"
                disabled={identitiesLoading || linkLoadingProvider !== null || !canUnlinkGoogle}
              >
                Unlink
              </button>
            )}
          </div>

          {linkedProviders.google && !canUnlinkGoogle && (
            <div className="rounded p-1.5 text-[11px] bg-yellow-100 text-yellow-800">Add another sign-in method before unlinking Google.</div>
          )}

          {linkMessage && (
            <div className={`rounded p-1.5 text-[11px] ${linkMessage.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {linkMessage.text}
            </div>
          )}
        </div>

        <div className="border border-gray-400 rounded-md p-1 flex flex-col items-center">
          <div className="flex justify-center items-center  w-full">
            <span className="relative flex gap-1 items-center justify-center">
              {hasInvites && <span className="absolute top-2 -left-3 w-1.75 h-1.75 bg-red-500 rounded-full border border-white"></span>}
              <span className="text-sm text-center text-nowrap">Pending Invites</span>
              <button onClick={() => refreshInvites()} className="p-1 cursor-pointer disabled:opacity-50" disabled={spinning}>
                <RefreshCw size={16} className={spinning ? "animate-spin [animation-duration:600ms]" : ""} />
              </button>
            </span>
          </div>
          <InvitesList invitesState={invitesState} spinning={spinning} />
        </div>
        <div className="flex justify-center items-center">
          <button
            onClick={async () => {
              await onLogout()
              onClose()
            }}
            className="rounded-lg bg-red-500 px-4 py-2 w-max text-white hover:bg-red-600 transition cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
