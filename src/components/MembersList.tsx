import { deleteListInvite } from "@/utils/deleteListInvite"
import { deleteListUser } from "@/utils/deleteListUser"
import { getListMembers, ListMember } from "@/utils/getListMembers"
import { updateListInvite } from "@/utils/updateListInvite"
import { Session } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

interface MembersListProps {
  listId: string
  session: Session
}

export const MembersList = ({ listId, session }: MembersListProps) => {
  const [users, setUsers] = useState<ListMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleRoleChange = async (userEmail: ListMember["email"], newRole: "editor" | "viewer") => {
    const target = users.find(u => u.email === userEmail)

    if (target?.role === "owner") {
      console.warn("Cannot change the role of the owner.")
      return
    }

    const { error } = await updateListInvite({
      listId,
      email: userEmail ?? "emailError",
      session,
      newRole
    })
    if (error) {
      console.error(error)
      return
    }
    setUsers(prev => prev.map(u => (u.email === userEmail ? { ...u, role: newRole } : u)))
  }

  const handleDelete = async (user: ListMember) => {
    if (user.role === "owner") {
      console.warn("Cannot delete the owner.")
      return
    }

    let error

    if (user.pending) {
      const res = await deleteListInvite({
        listId,
        email: user.email as string,
        session
      })
      error = res.error
    } else {
      const res = await deleteListUser({
        listId,
        userId: user.user_id as string,
        session
      })
      error = res.error
    }

    if (error) {
      console.error(error)
      return
    }

    // setUsers(prev => prev.filter(u => (user.pending ? u.email !== user.email : u.user_id !== user.user_id)))
  }

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      const { data, error } = await getListMembers(listId)

      if (error) {
        setError(error)
      } else if (data) {
        setUsers(data)
      }

      setLoading(false)
    }

    fetchMembers()
  }, [listId])

  if (loading) return <div>Loading members...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>

  return (
    <div className="flex flex-col gap-2">
      {users
        .filter(user => user.role !== "owner")
        .map(user => (
          <div key={user.pending ? user.email : user.user_id} className="flex items-center justify-between border rounded p-2">
            {/* Name / Email */}
            <span className="flex-1">{user.username ?? "Anon"}</span>

            {/* Role select */}
            <select
              name="role-select"
              value={user.role}
              onChange={e => handleRoleChange(user.email, e.target.value as "editor" | "viewer")}
              // disabled={user.pending} // prevent changing role for pending invites
              className={`border rounded px-2 py-1`}
            >
              <option value="editor" className="bg-gray-900">
                Editor
              </option>
              <option value="viewer" className="bg-gray-900">
                Viewer
              </option>
            </select>

            <button onClick={() => handleDelete(user)} className="text-red-500 px-2 py-1">
              Delete
            </button>
          </div>
        ))}
    </div>
  )
}
