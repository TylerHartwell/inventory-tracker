import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { Task } from "@/components/task-manager"
import { deleteImage } from "./deleteImage"

export const updateTask = async (task: Task, session: Session, updates: Partial<{ title: string; description: string; taskImage: File }>) => {
  if (!session.user) {
    console.error("Not authenticated")
    return
  }

  try {
    let imageUrl: string | null = null

    if (updates.taskImage) {
      if (task.image_url) {
        await deleteImage(session, task.image_url)
      }
      imageUrl = await uploadImage(session, updates.taskImage)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { taskImage, ...rest } = updates

    const finalUpdates = imageUrl ? { ...rest, image_url: imageUrl } : rest

    const { error } = await supabase.from("tasks").update(finalUpdates).eq("id", task.id)

    if (error) {
      console.error("Error updating task: ", error.message)
      return
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}
