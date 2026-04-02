import type { NextConfig } from "next"

const getSupabaseRemotePattern = (): {
  protocol: "http" | "https"
  hostname: string
  port?: string
  pathname: string
} => {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is required")
  }

  try {
    const url = new URL(supabaseUrl)
    const protocol = url.protocol.replace(":", "")

    if (protocol !== "http" && protocol !== "https") {
      throw new Error(`Unsupported Supabase URL protocol: ${url.protocol}`)
    }

    return {
      protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "**"
    }
  } catch (error) {
    console.error(error)
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    qualities: [25, 70, 75],
    remotePatterns: [
      getSupabaseRemotePattern(),
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "15421",
        pathname: "**"
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "15421",
        pathname: "**"
      }
    ]
  }
}

export default nextConfig
