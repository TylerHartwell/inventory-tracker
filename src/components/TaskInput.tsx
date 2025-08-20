import { FormEvent, useState } from "react"
import { Session } from "@supabase/supabase-js"
import ImageSelector from "./ImageSelector"
import { insertTask } from "@/utils/insertTask"

export const TaskInput = ({ session }: { session: Session }) => {
  const [newTask, setNewTask] = useState({ title: "", description: "" })
  const [taskImage, setTaskImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetId, setResetId] = useState(0)

  const clearForm = () => {
    setNewTask({ title: "", description: "" })
    setTaskImage(null)
    setResetId(id => id + 1)
  }

  const handleLocalImage = (file: File) => {
    if (file) {
      setTaskImage(file)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!session.user) {
      console.error("Not authenticated")
      return
    }

    const { title, description } = newTask

    if (!title.trim() || !description.trim()) {
      alert("Title and description are required.")
      return
    }

    setLoading(true)

    try {
      await insertTask(session, title, description, taskImage)
    } catch (err) {
      console.error("Failed to insert task:", err)
      return
    } finally {
      setLoading(false)
    }

    clearForm()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 p-2 relative border-2">
      <input
        type="text"
        placeholder="Task Title"
        name="title"
        value={newTask.title}
        onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <textarea
        placeholder="Task Description"
        value={newTask.description}
        onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
        className="w-full p-2 border border-gray-300 rounded min-h-min"
      />

      <ImageSelector handleLocalImage={handleLocalImage} key={resetId} />

      <div className="flex justify-between">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-blue-700 w-fit">
          Add Task
        </button>
        <button type="button" onClick={clearForm} disabled={loading} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-blue-700 w-fit">
          Clear Form
        </button>
      </div>

      {loading && (
        <div className="absolute flex items-center justify-center bottom-3 left-1/2 -translate-x-1/2">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </form>
  )
}
