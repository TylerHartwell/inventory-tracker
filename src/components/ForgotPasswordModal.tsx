import { supabase } from "@/supabase-client"
import { SubmitEventHandler, useState } from "react"

type ForgotPasswordModalProps = {
  initialEmail: string
  onClose: () => void
}

function ForgotPasswordModal({ initialEmail, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail)
  const [resetLinkSent, setResetLinkSent] = useState(false)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()

    if (!email) return

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/change-password`
    })

    setResetLinkSent(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-sm rounded-xl bg-gray-700 p-4 text-white shadow-lg" onClick={e => e.stopPropagation()}>
        {resetLinkSent ? (
          <>
            <h3 className="text-lg font-semibold mb-1">Check Your Email</h3>
            <p className="text-sm text-gray-300 mb-4">We sent a password reset link to {email}.</p>
            <div className="flex justify-end">
              <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded hover-fine:outline-1 active:outline-1" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-1">Reset Password</h3>
            <p className="text-sm text-gray-300 mb-4">{`Enter your email address and we'll send you a reset link.`}</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full mb-4 p-2 border border-gray-500 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-gray-500 text-white rounded hover-fine:outline-1 active:outline-1" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover-fine:outline-1 active:outline-1 disabled:opacity-50"
                  disabled={!email}
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordModal
