import { useCallback, useEffect, useState } from "react"
import { supabase } from "../supabase-client"
import { Session } from "@supabase/supabase-js"
import { TaskInput } from "./TaskInput"
import { TaskCard } from "./TaskCard"

export interface Task {
  id: number
  title: string
  description: string
  created_at: string
  image_url: string | null
  signedUrl: string | null
}

function TaskManager({ session }: { session: Session }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const generateSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
    const expirySeconds = 60 * 20
    const { data, error } = await supabase.storage.from("tasks-images").createSignedUrl(filePath, expirySeconds)

    if (error || !data) {
      console.error("Signed URL error:", error?.message)
      return null
    }

    return data.signedUrl
  }, [])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { error, data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Error reading task: ", error.message)
      setLoading(false)
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
    setLoading(false)
  }, [generateSignedUrl])

  useEffect(() => {
    fetchTasks()

    const channel = supabase.channel("tasks-channel")

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, async payload => {
        const newTask = payload.new as Task
        let signedUrl: string | null = null
        try {
          if (newTask.image_url) {
            signedUrl = await generateSignedUrl(newTask.image_url)
          }

          setTasks(prev => [...prev, { ...newTask, signedUrl }])
        } catch (err) {
          console.error("Error handling task insert:", err)
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" }, async payload => {
        const updatedTask = payload.new as Task
        let signedUrl: string | null = null

        try {
          if (updatedTask.image_url) {
            signedUrl = await generateSignedUrl(updatedTask.image_url)
          }

          setTasks(prev =>
            prev.map(task => {
              if (task.id !== updatedTask.id) return task

              return { ...updatedTask, signedUrl }
            })
          )
        } catch (err) {
          console.error("Error handling task update:", err)
        }
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
  }, [fetchTasks, generateSignedUrl])

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Task Manager CRUD</h2>
      <TaskInput session={session} />
      <ul className="list-none p-0">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="border border-gray-300 rounded p-4 mb-2 animate-pulse">
                <div className="h-8 w-3/4 bg-gray-900 rounded mb-2"></div>
                <div className="h-8 w-1/2 bg-gray-900 rounded"></div>
              </li>
            ))
          : tasks.map((task, index) => <TaskCard task={task} key={task.id} session={session} isPriority={index <= 3} />)}
      </ul>
    </div>
  )
}

export default TaskManager
