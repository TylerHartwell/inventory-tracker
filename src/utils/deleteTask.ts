import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { deleteImage } from "./deleteImage"
import { Task } from "@/components/task-manager"

export const deleteTask = async (task: Task, session: Session) => {
  if (!session.user) {
    console.error("Not authenticated")
    return
  }
  try {
    if (task.image_url) {
      await deleteImage(session, task.image_url)
    }

    const { error: dbError } = await supabase.from("tasks").delete().eq("id", task.id)

    if (dbError) {
      console.error("Error deleting task:", dbError.message)
      return
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}
