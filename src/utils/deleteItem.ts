import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { Item } from "@/components/ItemManager"

export const deleteItem = async (item: Item, session: Session) => {
  if (!session.user) {
    console.error("Not authenticated")
    return
  }
  try {
    const { error: dbError } = await supabase.from("items").delete().eq("id", item.id)

    if (dbError) {
      console.error("Error deleting item:", dbError.message)
      return
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}
