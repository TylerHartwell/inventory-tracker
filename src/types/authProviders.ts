export type OAuthProvider = "google"
type PasswordProvider = "email"

type SignInProvider = OAuthProvider | PasswordProvider

export type ProviderConfig = {
  id: SignInProvider
  label: string
}
