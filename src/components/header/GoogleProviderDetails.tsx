import { supabase } from "@/supabase-client"
import { useEffect, useState } from "react"

interface GoogleProviderDetailsProps {
  userEmail: string
  onErrorMessage: (text: string | null) => void
}

const validateGoogleLinkRequest = (email: string): string | null => {
  if (!email) {
    return "Your account must have an email before you can link Google sign-in."
  }

  const normalizeEmail = (email: string | null | undefined) => email?.trim().toLowerCase() ?? ""

  const isGmailAddress = (email: string) => normalizeEmail(email).endsWith("@gmail.com")

  if (!isGmailAddress(email)) {
    return "Your account email must be a Gmail address (@gmail.com) to link Google sign-in. Update your email address first."
  }

  return null
}

export function GoogleProviderDetails({ userEmail, onErrorMessage }: GoogleProviderDetailsProps) {
  const [linked, setLinked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkLinkedStatus = async () => {
      setLoading(true)

      try {
        const { data: identitiesData, error } = await supabase.auth.getUserIdentities()

        if (error || !identitiesData) {
          throw new Error(error?.message || "Failed to fetch user identities.")
        }

        const googleIdentity = identitiesData.identities.find(identity => identity.provider === "google")

        setLinked(!!googleIdentity)
      } catch (error) {
        onErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    checkLinkedStatus()
  }, [onErrorMessage])

  const handleLinkGoogle = async () => {
    const validationError = validateGoogleLinkRequest(userEmail)

    if (validationError) {
      onErrorMessage(validationError)
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      onErrorMessage(error.message)
      setLoading(false)
      return
    }

    onErrorMessage(null)
    setLoading(false)
    return
  }

  const handleUnlinkGoogle = async () => {
    setLoading(true)
    const { data: identitiesObj, error } = await supabase.auth.getUserIdentities()

    if (error || !identitiesObj) {
      onErrorMessage(error?.message || "Failed to fetch user identities.")
      setLoading(false)
      return
    }

    const identities = identitiesObj.identities

    if (identities.length < 2) {
      onErrorMessage("Must have at least one other sign-in method linked to unlink Google.")
      setLoading(false)
      return
    }

    const googleIdentity = identities.find(identity => identity.provider === "google")

    if (!googleIdentity) {
      onErrorMessage("Google is not currently linked to this account.")
      setLoading(false)
      return
    }

    const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity)

    if (unlinkError) {
      onErrorMessage(unlinkError.message)
      setLoading(false)
      return
    }
    setLinked(false)
    setLoading(false)
  }

  const handleClick = async () => {
    if (!linked) {
      await handleLinkGoogle()
      return
    }
    await handleUnlinkGoogle()
    return
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${linked ? "bg-gray-600 text-white" : "bg-blue-600 text-white"}`}
    >
      {linked ? "Unlink" : "Link"}
    </button>
  )
}
