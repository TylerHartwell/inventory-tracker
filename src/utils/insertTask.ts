import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { supabase } from "@/supabase-client"

interface Task {
  id: number
  title: string
  description: string
  email: string
  image_url: string | null
  signedUrl: string | null
  created_at: string
}

export interface InsertTaskParams {
  session: Session
  title: string
  description?: string
  taskImage?: File | null
}

export const insertTask = async ({ session, title, description = "", taskImage }: InsertTaskParams): Promise<Task | null> => {
  if (!session.user) {
    console.error("Not authenticated")
    return null
  }

  if (!title.trim()) {
    console.error("Title is required.")
    return null
  }

  try {
    let imageUrl: string | null = null

    if (taskImage) {
      imageUrl = await uploadImage(session, taskImage)
    }

    const { data: insertedTask, error } = await supabase
      .from("tasks")
      .insert({ title, description, email: session.user.email, image_url: imageUrl ?? "" })
      .select("*")
      .single()

    if (error || !insertedTask) {
      console.error("Error adding task: ", error?.message)
      return null
    }

    // Generate signed URL if image exists
    let signedUrl: string | null = null
    if (insertedTask.image_url) {
      const { data, error } = await supabase.storage.from("tasks-images").createSignedUrl(insertedTask.image_url, 60 * 20)
      if (!error && data) signedUrl = data.signedUrl
    }

    return { ...insertedTask, signedUrl }
  } catch (err) {
    console.error("Unexpected error:", err)
    return null
  }
}
