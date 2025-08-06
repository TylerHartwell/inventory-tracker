import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_API_KEY

if (!url || !key) {
  throw new Error("Missing Supabase env vars")
}

export const supabase = createClient(url, key)
