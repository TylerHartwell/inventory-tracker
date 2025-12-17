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
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (mode === "signUp") {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        setMessage({
          type: "success",
          text: "Sign-up successful! Please check your email to confirm your account before logging in."
        })
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleAuth("signIn")
  }

  const inputClass = "w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4 text-center">Sign In / Sign Up</h2>

      {message && (
        <div className={`mb-4 p-2 rounded text-sm ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4">
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
          className={inputClass}
        />

        <div className="flex gap-2">
          <button
            type="submit" // Default when pressing Enter
            className="flex-1 py-2 bg-blue-600 text-white rounded hover-fine:outline-1 active:outline-1 disabled:opacity-50"
            disabled={loading}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleAuth("signUp")}
            className="flex-1 py-2 bg-green-600 text-white rounded hover-fine:outline-1 active:outline-1 disabled:opacity-50"
            disabled={loading}
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
    </div>
  )
}

export default Auth
