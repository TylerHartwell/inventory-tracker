import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react"
import { supabase } from "../../supabase-client"
import { Session } from "@supabase/supabase-js"
import Image from "next/image"

interface Task {
  id: number
  title: string
  description: string
  created_at: string
  image_url: string
  signedUrl?: string
}

function TaskManager({ session }: { session: Session }) {
  const [newTask, setNewTask] = useState({ title: "", description: "" })
  const [tasks, setTasks] = useState<Task[]>([])
  const [descriptions, setDescriptions] = useState<{ [id: number]: string }>({})
  const [taskImage, setTaskImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTasks = useCallback(async () => {
    const { error, data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Error reading task: ", error.message)
      return
    }

    const withSignedUrls = await Promise.all(
      data.map(async task => {
        if (!task.image_url) return task
        const signedUrl = await generateSignedUrl(task.image_url)
        return { ...task, signedUrl }
      })
    )

    setTasks(withSignedUrls)
  }, [])

  const deleteTask = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) {
      console.error("Error deleting task: ", error.message)
      return
    }
    fetchTasks()
  }

  const updateTask = async (id: number) => {
    const updatedDescription = descriptions[id]
    if (!updatedDescription) return
    const { error } = await supabase.from("tasks").update({ description: updatedDescription }).eq("id", id)

    if (error) {
      console.error("Error updating task: ", error.message)
      return
    }
    fetchTasks()
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

    setLoading(false)
  }

  const generateSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from("tasks-images").createSignedUrl(filePath, 60 * 5)

    if (error || !data) {
      console.error("Signed URL error:", error?.message)
      return null
    }

    return data.signedUrl
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0])
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    const channel = supabase.channel("tasks-channel")
    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, payload => {
        const newTask = payload.new as Task
        setTasks(prev => [...prev, newTask])
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" }, payload => {
        const updatedTask = payload.new as Task
        setTasks(prev => prev.map(task => (task.id === updatedTask.id ? updatedTask : task)))
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tasks" }, payload => {
        const deletedId = payload.old.id
        setTasks(prev => prev.filter(task => task.id !== deletedId))
      })
      .subscribe(status => {
        console.log("Subscription: ", status)
      })

    return () => {
      channel.unsubscribe()
    }
  }, [])

  console.log(tasks)

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Task Manager CRUD</h2>

      {/* Form to add a new task */}
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
        <input type="file" accept="image/*" onChange={handleFileChange} />

        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add Task
        </button>
      </form>

      {/* List of Tasks */}
      <ul className="list-none p-0">
        {tasks.map((task, key) => (
          <li key={key} className="border border-gray-300 rounded p-4 mb-2">
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
                  value={descriptions[task.id] || ""}
                  onChange={e => setDescriptions(prev => ({ ...prev, [task.id]: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={() => updateTask(task.id)}>
                    Edit
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={() => deleteTask(task.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TaskManager
