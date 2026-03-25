import { ProviderConfig } from "@/types/authProviders"
import { ProviderItem } from "./ProviderItem"

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

export function SignInMethodsPanel({ userEmail }: { userEmail: string }) {
  return (
    <div className="border border-gray-400 rounded-md p-1.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-center relative">
        <span className="text-sm font-medium">Sign-In Methods</span>
      </div>

      {PROVIDERS.map(provider => {
        return <ProviderItem key={provider.id} provider={provider} userEmail={userEmail} />
      })}
    </div>
  )
}
