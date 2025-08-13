import { useState } from "react"
import { Task } from "./task-manager"
import Image from "next/image"
import { supabase } from "@/supabase-client"

export const TaskCard = ({ task, fetchTasks }: { task: Task; fetchTasks: () => Promise<void> }) => {
  const [description, setDescription] = useState<string>("")

  const deleteTask = async (id: number, imageUrl: string) => {
    try {
      if (imageUrl) {
        const { error: storageError } = await supabase.storage.from("tasks-images").remove([imageUrl])

        if (storageError) {
          console.error("Error deleting image:", storageError.message)
        }
      }

      const { error: dbError } = await supabase.from("tasks").delete().eq("id", id)

      if (dbError) {
        console.error("Error deleting task:", dbError.message)
        return
      }

      fetchTasks()
    } catch (err) {
      console.error("Unexpected error:", err)
    }
  }

  const updateTask = async (id: number) => {
    const updatedDescription = description
    if (!updatedDescription) return
    const { error } = await supabase.from("tasks").update({ description: updatedDescription }).eq("id", id)

    if (error) {
      console.error("Error updating task: ", error.message)
      return
    }
    setDescription("")
    fetchTasks()
  }

  return (
    <li key={task.id} className="border border-gray-300 rounded p-4 mb-2">
      <div>
        <h3 className="text-xl font-medium">{task.title}</h3>
        <p className="mb-2">{task.description}</p>
        {task.signedUrl && (
          <div className="mb-2">
            <Image src={task.signedUrl} unoptimized alt="Task image" width={300} height={200} className="h-40 w-auto object-cover rounded" />
          </div>
        )}
        <div className="space-y-2">
          <textarea
            placeholder="Updated description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={() => updateTask(task.id)}>
              Edit
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={() => deleteTask(task.id, task.image_url)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
