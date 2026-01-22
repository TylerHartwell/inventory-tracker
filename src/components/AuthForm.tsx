import { useState, FormEvent } from "react"
import { supabase } from "../supabase-client"

const Auth = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await handleAuth("signIn")
  }

  const inputClass = "w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
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

      <form onSubmit={handleSubmit} className="mb-4 max-w-xs">
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
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleAuth("signUp")}
            className="flex-1 py-2 bg-green-600 text-white rounded hover-fine:outline-1 active:outline-1 disabled:opacity-50"
            disabled={loading || !email || !password}
          >
            Sign Up
          </button>
        </div>
        {loading && (
          <div className="flex items-center justify-center mt-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </form>

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
  )
}

export default Auth
