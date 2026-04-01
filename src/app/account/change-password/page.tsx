"use client"

import { supabase } from "@/supabase-client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, type SubmitEventHandler } from "react"

function ChangePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      setIsAuthenticated(true)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    setMessage(null)

    if (!password || !confirmPassword) {
      setMessage({ type: "error", text: "Both password fields are required." })
      return
    }

    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long." })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw new Error(error.message)

      setMessage({ type: "success", text: "Password changed successfully!" })
      setPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const inputClass = "w-full mb-4 p-2 text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-600 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-2 text-black">Change Password</h1>
        <p className="text-gray-600 mb-6">Enter your new password below.</p>

        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="New Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            disabled={loading}
          />
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={inputClass}
            disabled={loading}
          />

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !password || !confirmPassword}
            title={loading ? "Updating password..." : "Change password"}
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Remember your password?{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ChangePasswordPage
