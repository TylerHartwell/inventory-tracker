import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase-client"
import { Session } from "@supabase/supabase-js"

export interface Task {
  id: number
  title: string
  description: string
  created_at: string
  image_url: string | null
  signedUrl: string | null
}

export function useTasksRealtime(session: Session) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const tasksRef = useRef<Task[]>([]) // Keep ref for interval

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  // Generate signed URL for a file
  const generateSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
    if (!filePath) return null
    const expirySeconds = 60 * 20 // 20 minutes
    const { data, error } = await supabase.storage.from("tasks-images").createSignedUrl(filePath, expirySeconds)
    if (error || !data) {
      console.error("Signed URL error:", error?.message)
      return null
    }
    return data.signedUrl
  }, [])

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: true })

    if (error || !data) {
      console.error("Error fetching tasks:", error?.message)
      setLoading(false)
      return
    }

    const withSignedUrls = await Promise.all(
      data.map(async task => ({
        ...task,
        signedUrl: task.image_url ? await generateSignedUrl(task.image_url) : null
      }))
    )

    setTasks(withSignedUrls)
    setLoading(false)
  }, [generateSignedUrl])

  // Realtime subscription
  useEffect(() => {
    fetchTasks()

    const channel = supabase.channel(`tasks-${session.user.id}`)

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, async payload => {
        const newTask = payload.new as Task
        const signedUrl = newTask.image_url ? await generateSignedUrl(newTask.image_url) : null
        setTasks(prev => [...prev, { ...newTask, signedUrl }])
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" }, async payload => {
        const updatedTask = payload.new as Task
        const signedUrl = updatedTask.image_url ? await generateSignedUrl(updatedTask.image_url) : null
        setTasks(prev => prev.map(task => (task.id === updatedTask.id ? { ...updatedTask, signedUrl } : task)))
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tasks" }, payload => {
        const deletedId = payload.old.id
        setTasks(prev => prev.filter(task => task.id !== deletedId))
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [fetchTasks, generateSignedUrl, session.user.id])

  // Auto-refresh only tasks that have image_url
  useEffect(() => {
    const interval = setInterval(async () => {
      const refreshedTasks = await Promise.all(
        tasksRef.current.map(async task => {
          if (!task.image_url) return task // skip tasks without images
          const signedUrl = await generateSignedUrl(task.image_url)
          return { ...task, signedUrl }
        })
      )
      setTasks(refreshedTasks)
    }, 1000 * 60 * 15) // 15 minutes

    return () => clearInterval(interval)
  }, [generateSignedUrl])

  return { tasks, loading, refresh: fetchTasks }
}
