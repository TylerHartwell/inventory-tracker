import { ListInvite } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"

export interface InsertListInviteParams {
  session: Session
  email: ListInvite["email"]
  listId: ListInvite["list_id"]
  role: ListInvite["role"]
}

export const insertListInvite = async ({
  session,
  email,
  listId,
  role
}: InsertListInviteParams): Promise<
  | { data: ListInvite; error: null }
  | {
      data: null
      error: string
    }
> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }
  const { data, error } = await supabase.from("list_invites").insert({ email, list_id: listId, role }).select("*").single()

  if (error) {
    if (error.code === "42501") {
      return {
        data: null,
        error: "That user is already a member of this list"
      }
    }
    if (error.code === "23505") {
      return {
        data: null,
        error: "An invitation has already been sent to this email."
      }
    }
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}
