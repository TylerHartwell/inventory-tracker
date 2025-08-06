import { useState, FormEvent } from "react"
import { supabase } from "../../supabase-client"

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !password) {
      setMessage({ type: "error", text: "Email and password are required." })
      return
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." })
      setLoading(false)
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        setMessage({ type: "success", text: "Sign-up successful! Please check your email to confirm your account before logging in." })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred."
      console.error(message)
      setMessage({ type: "error", text: message })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4 text-center">{isSignUp ? "Sign Up" : "Sign In"}</h2>

      {message && (
        <div className={`mb-4 p-2 rounded text-sm ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="email"
          placeholder="Email"
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
          value={password}
          onChange={e => {
            setPassword(e.target.value)
            setMessage(null)
          }}
          className={inputClass}
        />
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
          {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>

      <button
        onClick={() => !loading && setIsSignUp(!isSignUp)}
        className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        disabled={loading}
      >
        {isSignUp ? "Switch to Sign In" : "Switch to Sign Up"}
      </button>
    </div>
  )
}
