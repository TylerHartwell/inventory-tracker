import { Session } from "@supabase/supabase-js"
import { TaskInput } from "./TaskInput"
import { TaskCard } from "./TaskCard"
import { useTasksRealtime } from "@/hooks/useTasksRealtime"

export interface Task {
  id: number
  title: string
  description: string
  created_at: string
  image_url: string | null
  signedUrl: string | null
}

function TaskManager({ session }: { session: Session }) {
  const { tasks, loading, refresh } = useTasksRealtime(session)

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Task Manager CRUD</h2>
      <TaskInput session={session} refresh={refresh} />
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
