import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { supabase } from "@/supabase-client"

export interface InsertTaskParams {
  session: Session
  title: string
  description?: string
  taskImage?: File | null
}

export const insertTask = async ({ session, title, description = "", taskImage }: InsertTaskParams) => {
  if (!session.user) {
    console.error("Not authenticated")
    return
  }

  if (!title.trim()) {
    console.error("Title is required.")
    return
  }

  try {
    let imageUrl: string | null = null

    if (taskImage) {
      imageUrl = await uploadImage(session, taskImage)
    }

    const { error } = await supabase.from("tasks").insert({ title, description, email: session.user.email, image_url: imageUrl ?? "" })

    if (error) {
      console.error("Error adding task: ", error.message)
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}
