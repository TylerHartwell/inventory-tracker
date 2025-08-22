import { useState } from "react"
import { Task } from "./TaskManager"
import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"
import ImageSelector from "./ImageSelector"
import { Session } from "@supabase/supabase-js"
import { deleteTask } from "@/utils/deleteTask"
import { updateTask } from "@/utils/updateTask"

export const TaskCard = ({ task, session, isPriority }: { task: Task; session: Session; isPriority: boolean }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState<string>(task.title)
  const [description, setDescription] = useState<string>(task.description)
  const [taskImage, setTaskImage] = useState<File | null>(null)
  const [isImageRemoval, setIsImageRemoval] = useState<boolean>(false)

  const handleLocalImage = (file: File | null) => {
    setTaskImage(file)
    if (!file && task.image_url) setIsImageRemoval(true)
  }

  const handleCancelEdit = () => {
    setTitle(task.title)
    setDescription(task.description)
    setIsEditing(false)
  }

  const handleDeleteTask = async () => {
    if (!session.user) {
      console.error("Not authenticated")
      return
    }
    try {
      if (window.confirm("Are you sure you want to delete this task?")) {
        await deleteTask(task, session)
      }
    } catch (err) {
      console.error("Failed to delete task:", err)
    }
  }

  const handleUpdateTask = async () => {
    if (!session.user) {
      console.error("Not authenticated")
      return
    }

    if (!title.trim()) {
      alert("Title is required")
      return
    }

    const updates: Partial<{ title: string; description: string; taskImage: File | null }> = {}

    if (title.trim() && title !== task.title) {
      updates.title = title.trim()
    }

    if (description.trim() !== task.description) {
      updates.description = description.trim()
    }

    if (isImageRemoval) {
      updates.taskImage = null
    }

    if (taskImage) {
      updates.taskImage = taskImage
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false)
      return
    }

    try {
      await updateTask(task, session, updates)
    } catch (err) {
      console.error("Unexpected error:", err)
      return
    }

    if (updates.title) setTitle(updates.title)
    if (updates.description) setDescription(updates.description)
    if (taskImage) setTaskImage(null)
    if (isImageRemoval) setIsImageRemoval(false)

    setIsEditing(false)
  }

  return (
    <li key={task.id} className="border border-gray-300 rounded p-4 mb-2">
      <div>
        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={isEditing ? "Updated title..." : ""}
          readOnly={!isEditing}
          className={`w-full p-2 rounded text-base font-normal
    ${isEditing ? "border border-gray-300" : "border-none bg-transparent focus:outline-none cursor-default"}`}
        />

        {/* Description */}
        {isEditing || description ? (
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={isEditing ? "Updated description..." : ""}
            readOnly={!isEditing}
            className={`w-full p-2 rounded text-base font-normal whitespace-pre-line h-10
      ${isEditing ? "border border-gray-300 " : "border-none bg-transparent focus:outline-none cursor-default"}`}
          />
        ) : null}

        {/* Image selector only editable when editing */}
        {isEditing && (
          <div className="flex items-center mb-2">
            <ImageSelector handleLocalImage={handleLocalImage} signedUrl={task.signedUrl ?? null} />
          </div>
        )}

        {/* Display image */}
        {task.signedUrl && !isEditing && (
          <div className="relative mb-2 h-40 w-auto">
            <Image src={task.signedUrl} unoptimized alt="Task image" fill priority={isPriority} className="object-contain rounded" />
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2">
          <div className="flex space-x-2 justify-between">
            {isEditing ? (
              <>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={handleUpdateTask}>
                  Update
                </button>
              </>
            ) : (
              <>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={() => setIsEditing(true)}>
                  <Pencil size={16} />
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={handleDeleteTask}>
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
