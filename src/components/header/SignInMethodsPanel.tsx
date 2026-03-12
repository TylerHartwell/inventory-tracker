import { RefreshCw } from "lucide-react"
import { UserProfile } from "@/hooks/useUserProfile"
import { ProviderConfig } from "@/types/authProviders"
import { ProviderItem } from "./ProviderItem"
import { useSignInMethods } from "../../hooks/useSignInMethods"

const PROVIDERS: ProviderConfig[] = [
  {
    id: "google",
    label: "Google"
  },
  {
    id: "email",
    label: "Email & Password"
  }
]

export function SignInMethodsPanel({ userProfile }: { userProfile: UserProfile }) {
  const currentAccountEmail = userProfile.profile?.email?.trim() ?? ""
  const { getProviderStatus, handleProviderAction, identitiesLoading, linkMessage } = useSignInMethods(currentAccountEmail)

  return (
    <div className="border border-gray-400 rounded-md p-1.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-center relative">
        <span className="text-sm font-medium">Sign-In Methods</span>
        {identitiesLoading && <RefreshCw size={14} className="absolute right-0 animate-spin [animation-duration:600ms]" />}
      </div>

      {PROVIDERS.map(provider => {
        return <ProviderItem key={provider.id} provider={provider} status={getProviderStatus(provider.id)} onAction={handleProviderAction} />
      })}

      {linkMessage && (
        <div className={`rounded p-1.5 text-[11px] ${linkMessage.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {linkMessage.text}
        </div>
      )}
    </div>
  )
}
