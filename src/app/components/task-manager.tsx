import { useCallback, useEffect, useState } from "react"
import { supabase } from "../../supabase-client"
import { Session } from "@supabase/supabase-js"
import { TaskInput } from "./TaskInput"
import { TaskCard } from "./TaskCard"

export interface Task {
  id: number
  title: string
  description: string
  created_at: string
  image_url: string
  signedUrl?: string
}

function TaskManager({ session }: { session: Session }) {
  const [tasks, setTasks] = useState<Task[]>([])

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

  const generateSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from("tasks-images").createSignedUrl(filePath, 60 * 5)

    if (error || !data) {
      console.error("Signed URL error:", error?.message)
      return null
    }

    return data.signedUrl
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
      <TaskInput session={session} />
      <ul className="list-none p-0">
        {tasks.map((task, key) => (
          <TaskCard task={task} fetchTasks={fetchTasks} key={key} />
        ))}
      </ul>
    </div>
  )
}

export default TaskManager
