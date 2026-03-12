import { ProviderConfig, ProviderStatus, SignInProvider } from "@/types/authProviders"

interface ProviderItemProps {
  provider: ProviderConfig
  status: ProviderStatus
  onAction: (providerId: SignInProvider) => Promise<void>
}

export function ProviderItem({ provider, status, onAction }: ProviderItemProps) {
  const actionLabel = provider.id === "email" ? (status.linked ? "Reset" : "Add") : status.linked ? "Unlink" : "Link"

  return (
    <div className="rounded-md border border-gray-500 p-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{provider.label}</span>

        <button
          onClick={() => void onAction(provider.id)}
          disabled={status.loading}
          className={`rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${
            status.linked ? "bg-gray-600 text-white" : "bg-blue-600 text-white"
          }`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
