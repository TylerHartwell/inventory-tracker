import { useState, type SyntheticEvent } from "react"
import { supabase } from "@/supabase-client"
import { OAuthProvider } from "@/types/authProviders"
import ForgotPasswordModal from "./ForgotPasswordModal"

const Auth = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)

  const handleAuth = async (mode: "signIn" | "signUp") => {
    if (!email || !password) {
      setMessage({ type: "error", text: "Email and password are required." })
      return
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long." })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (mode === "signUp") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw new Error(signUpError.message)
        setMessage({
          type: "success",
          text: "Sign-up successful! Please check your email to confirm your account before logging in."
        })
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw new Error(signInError.message)
        if (!data.session) {
          setMessage({
            type: "error",
            text: "Please check your email to confirm."
          })
        } else {
          setMessage({ type: "success", text: "Sign-in successful!" })
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred."
      setMessage({ type: "error", text: message })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    await handleAuth("signIn")
  }

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      })

      if (error) throw new Error(error.message)

      setMessage({
        type: "success",
        text: "Redirecting..."
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred."
      setMessage({ type: "error", text: message })
      setLoading(false)
    }
  }

  const inputClass = "w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <>
      <div className="mx-auto p-4 flex flex-col items-center">
        <h1 className="max-w-md text-2xl font-semibold text-center mb-2 flex gap-2 items-center">
          <span>-</span>Inventory Tracker<span>-</span>
        </h1>
        <h2 className="max-w-md text-md mb-4 text-center flex flex-col xs:flex-row xs:gap-1">
          <span>Flexible Item Collections.</span>
          <span>Shareable and Collaborative.</span>
        </h2>

        {message && (
          <div className={`mb-4 p-2 rounded text-sm ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message.text}
          </div>
        )}

        <div className="mb-4 max-w-xs w-full">
          <button
            type="button"
            onClick={() => handleOAuthSignIn("google")}
            className="w-full py-2 px-3 bg-white text-[#1f1f1f] border border-[#dadce0] rounded-md shadow-sm hover:bg-[#f8f9fa] active:bg-[#f1f3f4] transition disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
            title="Sign in with Google"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.75 3.28-8.1Z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.52H2.18v2.84A11 11 0 0 0 12 23Z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.11a6.6 6.6 0 0 1-.34-2.11c0-.73.12-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.96 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
              />
            </svg>
            <span className="text-sm font-medium">Sign in with Google</span>
          </button>

          <div className="my-3 text-xs text-center text-gray-300">or use email and password</div>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              name="email"
              autoComplete="on"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setMessage(null)
              }}
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setMessage(null)
              }}
              autoComplete="current-password"
              className={inputClass}
            />

            <div className="flex gap-2">
              <button
                type="submit" // Default when pressing Enter
                className="flex-1 py-2 bg-blue-600 text-white rounded hover-fine:outline-1 active:outline-1 disabled:opacity-50"
                disabled={loading || !email || !password}
                title="Sign in with email and password"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleAuth("signUp")}
                className="flex-1 py-2 bg-green-600 text-white rounded hover-fine:outline-1 active:outline-1 disabled:opacity-50"
                disabled={loading || !email || !password}
                title="Sign up with email and password"
              >
                Sign Up
              </button>
            </div>
            <div className="mt-2 text-center">
              <button
                type="button"
                className="text-xs text-blue-400 hover:underline"
                onClick={() => setForgotPasswordOpen(true)}
                title="Forgot password?"
              >
                Forgot password?
              </button>
            </div>
          </form>

          {loading && (
            <div className="flex items-center justify-center mt-4">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8 mt-4 items-center">
          <h3 className="max-w-lg">
            Create <strong>structured lists</strong> with rich item details, <strong>invite others</strong>, and control who can{" "}
            <strong>view or edit</strong>—perfect for cataloging, tracking, and collaborating.
          </h3>
          <ul className="list-disc ml-8">
            <li>Names, Descriptions, Details</li>
            <li>Images & Icons</li>
            <li>Dates (Purchase, Expiration, Warranty)</li>
            <li>Prices & Quantitites</li>
            <li>Categories & Tags</li>
            <li>And More...</li>
          </ul>
        </div>
      </div>

      {forgotPasswordOpen && <ForgotPasswordModal initialEmail={email} onClose={() => setForgotPasswordOpen(false)} />}
    </>
  )
}

export default Auth
