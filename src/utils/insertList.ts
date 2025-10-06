import { Session } from "@supabase/supabase-js"
import { supabase } from "@/supabase-client"

interface List {
  id: string
  owner_id: string
  name: string
  created_at: string
}

export interface InsertItemParams {
  session: Session
  listName: string
}

export const insertList = async ({ session, listName }: InsertItemParams): Promise<List | null> => {
  if (!session.user) {
    console.error("Not authenticated")
    return null
  }

  if (!listName.trim()) {
    console.error("List Name is required.")
    return null
  }

  try {
    const { data: insertedList, error } = await supabase.from("lists").insert({ name: listName, owner_id: session.user.id }).select("*").single()

    if (error || !insertedList) {
      console.error("Error adding list: ", error?.message, session)
      console.log("full error object: ", error)
      return null
    }

    return { ...insertedList }
  } catch (err) {
    console.error("Unexpected error:", err)
    return null
  }
}
