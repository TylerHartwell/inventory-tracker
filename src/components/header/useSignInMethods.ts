import { useCallback, useEffect, useState } from "react"
import { UserIdentity } from "@supabase/supabase-js"
import { supabase } from "@/supabase-client"
import { LinkMessage, OAuthProvider, ProviderStatus, SignInProvider } from "@/types/authProviders"

const GOOGLE_LINK_PENDING_KEY = "sign-in-methods-google-link-pending"
const GOOGLE_LINK_EXPECTED_EMAIL_KEY = "sign-in-methods-google-link-expected-email"
const PASSWORD_READY_SESSION_KEY = "sign-in-methods-password-ready"

const clearPendingGoogleLink = () => {
  window.sessionStorage.removeItem(GOOGLE_LINK_PENDING_KEY)
  window.sessionStorage.removeItem(GOOGLE_LINK_EXPECTED_EMAIL_KEY)
}

const markPasswordReady = () => {
  window.sessionStorage.setItem(PASSWORD_READY_SESSION_KEY, "true")
}

const isPasswordReadyInSession = () => window.sessionStorage.getItem(PASSWORD_READY_SESSION_KEY) === "true"

const getIdentityEmail = (identity: UserIdentity | undefined) => {
  const identityData = identity?.identity_data as { email?: string | null } | null | undefined

  return identityData?.email?.trim().toLowerCase() ?? ""
}

export function useSignInMethods(currentAccountEmail: string) {
  const [linkedProviders, setLinkedProviders] = useState<Record<SignInProvider, boolean>>({ google: false, email: false })
  const [linkLoadingProvider, setLinkLoadingProvider] = useState<OAuthProvider | null>(null)
  const [identitiesLoading, setIdentitiesLoading] = useState(false)
  const [linkMessage, setLinkMessage] = useState<LinkMessage | null>(null)
  const [passwordEmailLoading, setPasswordEmailLoading] = useState(false)

  const totalLinkedProviders = Number(linkedProviders.google) + Number(linkedProviders.email)

  const loadLinkedProviders = useCallback(async () => {
    setIdentitiesLoading(true)

    const [{ data, error }, { data: userData }] = await Promise.all([supabase.auth.getUserIdentities(), supabase.auth.getUser()])

    if (error) {
      setLinkMessage({ type: "error", text: error.message })
      setIdentitiesLoading(false)
      return
    }

    const identities = (data?.identities ?? []) as UserIdentity[]
    const googleIdentity = identities.find(identity => identity.provider === "google")
    const googleIdentityEmail = getIdentityEmail(googleIdentity)
    const accountEmail = userData.user?.email?.trim().toLowerCase() ?? currentAccountEmail.toLowerCase()
    const sessionProvider = typeof userData.user?.app_metadata?.provider === "string" ? userData.user.app_metadata.provider : null
    const metadataProviders = Array.isArray(userData.user?.app_metadata?.providers)
      ? userData.user.app_metadata.providers.filter((provider): provider is string => typeof provider === "string")
      : []
    const pendingGoogleLink = window.sessionStorage.getItem(GOOGLE_LINK_PENDING_KEY) === "true"
    const expectedGoogleEmail = window.sessionStorage.getItem(GOOGLE_LINK_EXPECTED_EMAIL_KEY)?.trim().toLowerCase() ?? accountEmail
    const emailMethodKnown =
      sessionProvider === "email" ||
      metadataProviders.includes("email") ||
      identities.some(identity => identity.provider === "email") ||
      isPasswordReadyInSession()

    if (pendingGoogleLink && googleIdentity && expectedGoogleEmail && googleIdentityEmail && googleIdentityEmail !== expectedGoogleEmail) {
      const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity)

      clearPendingGoogleLink()

      if (unlinkError) {
        setLinkMessage({ type: "error", text: unlinkError.message })
      } else {
        setLinkMessage({
          type: "error",
          text: "Google sign-in must use the same email as this account. The mismatched Google account was not linked."
        })
      }

      setLinkedProviders({ google: false, email: emailMethodKnown })
      setIdentitiesLoading(false)
      return
    }

    if (pendingGoogleLink) {
      clearPendingGoogleLink()

      if (googleIdentity) {
        setLinkMessage({ type: "success", text: "Google sign-in linked for this account." })
      }
    }

    setLinkedProviders({
      google: Boolean(googleIdentity),
      email: emailMethodKnown
    })

    setIdentitiesLoading(false)
  }, [currentAccountEmail])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLinkedProviders()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadLinkedProviders])

  const handleLinkProvider = async (provider: OAuthProvider) => {
    if (linkedProviders[provider]) {
      return
    }

    if (!currentAccountEmail) {
      setLinkMessage({ type: "error", text: "Your account must have an email before you can link Google sign-in." })
      return
    }

    setLinkLoadingProvider(provider)
    setLinkMessage(null)

    window.sessionStorage.setItem(GOOGLE_LINK_PENDING_KEY, "true")
    window.sessionStorage.setItem(GOOGLE_LINK_EXPECTED_EMAIL_KEY, currentAccountEmail.toLowerCase())

    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      clearPendingGoogleLink()
      setLinkMessage({ type: "error", text: error.message })
      setLinkLoadingProvider(null)
      return
    }

    setLinkMessage({ type: "success", text: `Redirecting to Google. Choose the Google account for ${currentAccountEmail}.` })
  }

  const handleUnlinkGoogle = async () => {
    if (totalLinkedProviders <= 1) {
      setLinkMessage({
        type: "error",
        text: "At least one sign-in provider must remain linked before Google can be unlinked."
      })
      return
    }

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

    const identities = (data?.identities ?? []) as UserIdentity[]
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

    setLinkedProviders(prev => ({ ...prev, google: false }))
    await loadLinkedProviders()
    setLinkLoadingProvider(null)
    setLinkMessage({ type: "success", text: "Google sign-in has been unlinked." })
  }

  const handleSendPasswordResetEmail = async () => {
    if (!currentAccountEmail) {
      setLinkMessage({ type: "error", text: "Your account must have an email before password setup/reset can be sent." })
      return
    }

    setPasswordEmailLoading(true)
    setLinkMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(currentAccountEmail, {
      redirectTo: window.location.origin
    })

    if (error) {
      setLinkMessage({ type: "error", text: error.message })
      setPasswordEmailLoading(false)
      return
    }

    markPasswordReady()
    setLinkedProviders(prev => ({ ...prev, email: true }))
    await loadLinkedProviders()
    setPasswordEmailLoading(false)
    setLinkMessage({
      type: "success",
      text: "Password reset email sent to your account email."
    })
  }

  const handleProviderAction = async (provider: SignInProvider) => {
    const action = linkedProviders[provider] ? "unlink" : "link"

    if (provider === "google") {
      if (action === "link") {
        await handleLinkProvider("google")
        return
      }

      await handleUnlinkGoogle()
      return
    }

    if (action === "link") {
      if (!currentAccountEmail) {
        setLinkMessage({ type: "error", text: "Your account must have an email before password setup/reset can be sent." })
        return
      }

      await handleSendPasswordResetEmail()
    }
  }

  const getProviderStatus = (provider: SignInProvider): ProviderStatus => ({
    linked: linkedProviders[provider],
    loading: identitiesLoading || passwordEmailLoading || (provider === "google" && linkLoadingProvider === "google")
  })

  return {
    getProviderStatus,
    handleProviderAction,
    identitiesLoading,
    linkMessage
  }
}
