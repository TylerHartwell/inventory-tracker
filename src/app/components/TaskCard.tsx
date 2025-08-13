import { useState } from "react"
import { Task } from "./task-manager"
import Image from "next/image"
import { supabase } from "@/supabase-client"
import { Pencil } from "lucide-react"

export const TaskCard = ({ task }: { task: Task }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState<string>(task.title)
  const [description, setDescription] = useState<string>(task.description)

  const handleCancelEdit = () => {
    setTitle(task.title)
    setDescription(task.description)
    setIsEditing(false)
  }

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
    } catch (err) {
      console.error("Unexpected error:", err)
    }
  }

  const updateTask = async (id: number) => {
    const updates: Partial<{ title: string; description: string }> = {}

    if (title.trim() && title !== task.title) {
      updates.title = title.trim()
    }

    if (description.trim() && description !== task.description) {
      updates.description = description.trim()
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false)
      return
    }

    const { error } = await supabase.from("tasks").update(updates).eq("id", id)

    if (error) {
      console.error("Error updating task: ", error.message)
      return
    }

    if (updates.title) setTitle(updates.title)
    if (updates.description) setDescription(updates.description)

    setIsEditing(false)
  }

  return (
    <li key={task.id} className="border border-gray-300 rounded p-4 mb-2">
      <div>
        {isEditing ? (
          <>
            <input
              placeholder="Updated title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <textarea
              placeholder="Updated description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
            {task.signedUrl && (
              <div className="relative mb-2 h-40 w-auto">
                <Image src={task.signedUrl} unoptimized alt="Task image" fill className="object-contain rounded" />
              </div>
            )}
            <div className="space-y-2">
              <div className="grid grid-cols-3 justify-items-center">
                <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 justify-self-start" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={() => updateTask(task.id)}>
                  Update
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-medium">{title}</h3>
            <p className="mb-2">{description}</p>
            {task.signedUrl && (
              <div className="relative mb-2 h-40 w-auto">
                <Image src={task.signedUrl} unoptimized alt="Task image" fill className="object-contain rounded" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex space-x-2 justify-between">
                <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={() => setIsEditing(true)}>
                  <Pencil size={16} />
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={() => deleteTask(task.id, task.image_url)}>
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </li>
  )
}
