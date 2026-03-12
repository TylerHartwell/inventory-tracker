export type OAuthProvider = "google"
export type PasswordProvider = "email"

export type SignInProvider = OAuthProvider | PasswordProvider

export type LinkMessage = {
  type: "error" | "success"
  text: string
}

export type ProviderStatus = {
  linked: boolean
  loading: boolean
}

export type ProviderConfig = {
  id: SignInProvider
  label: string
}
