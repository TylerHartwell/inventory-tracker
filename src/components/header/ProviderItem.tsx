import { useState } from "react"
import { ProviderConfig } from "@/types/authProviders"
import { EmailPasswordProviderDetails } from "./EmailPasswordProviderDetails"
import { GoogleProviderDetails } from "./GoogleProviderDetails"
import { supabase } from "@/supabase-client"

interface ProviderItemProps {
  provider: ProviderConfig
  userEmail: string
}

export function ProviderItem({ provider, userEmail }: ProviderItemProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleErrorMessage = (text: string | null) => {
    setErrorMessage(text)
  }

  return (
    <div className="rounded-md border border-gray-500 p-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{provider.label}</span>
      </div>
      {provider.id === "email" ? (
        <EmailPasswordProviderDetails userEmail={userEmail} onErrorMessage={handleErrorMessage} />
      ) : (
        <GoogleProviderDetails userEmail={userEmail} onErrorMessage={handleErrorMessage} />
      )}
      {errorMessage && <span className="text-red-500 text-xs">{errorMessage}</span>}
    </div>
  )
}
