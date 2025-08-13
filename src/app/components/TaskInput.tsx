import { FormEvent, useState } from "react"
import { Session } from "@supabase/supabase-js"
import { supabase } from "../../supabase-client"
import ImageUploader from "./ImageUploader"

export const TaskInput = ({ session }: { session: Session }) => {
  const [newTask, setNewTask] = useState({ title: "", description: "" })
  const [taskImage, setTaskImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetId, setResetId] = useState(0)

  const handleFileChange = (file: File) => {
    if (file) {
      setTaskImage(file)
    }
  }

  const uploadImage = async (file: File, session: Session): Promise<string | null> => {
    const user = session.user
    if (!user) {
      console.error("Not authenticated")
      return null
    }

    const filePath = `${user.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from("tasks-images").upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading image:", uploadError.message)
      return null
    }

    return filePath
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const { title, description } = newTask

    if (!title.trim() || !description.trim()) {
      alert("Title and description are required.")
      return
    }

    setLoading(true)

    let filePath: string | null = null
    if (taskImage) {
      filePath = await uploadImage(taskImage, session)
    }

    const { error } = await supabase.from("tasks").insert({ ...newTask, email: session.user.email, image_url: filePath ?? "" })

    if (error) {
      console.error("Error adding task: ", error.message)
    } else {
      setNewTask({ title: "", description: "" })
      setTaskImage(null)
    }

    setResetId(id => id + 1)
    setLoading(false)
  }
  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2">
      <input
        type="text"
        placeholder="Task Title"
        value={newTask.title}
        onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <textarea
        placeholder="Task Description"
        value={newTask.description}
        onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
        className="w-full p-2 border border-gray-300 rounded"
      />

      <ImageUploader onFileSelect={handleFileChange} key={resetId} />

      <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-blue-700">
        Add Task
      </button>
    </form>
  )
}
