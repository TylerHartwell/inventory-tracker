import type { NextConfig } from "next"

// Extract hostname from Supabase URL environment variable
const getSupabaseHostname = (): string => {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is required")
  }

  try {
    const url = new URL(supabaseUrl)
    return url.hostname
  } catch (error) {
    console.error(error)
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: getSupabaseHostname(),
        pathname: "**"
      }
    ]
  }
}

export default nextConfig
