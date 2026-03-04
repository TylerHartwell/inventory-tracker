import { deleteListInvite } from "@/utils/list-invite/deleteListInvite"
import { deleteListUser } from "@/utils/list-user/deleteListUser"
import { getListMembers } from "@/utils/getListMembers"
import { updateListInvite } from "@/utils/list-invite/updateListInvite"
import { updateListUser } from "@/utils/list-user/updateListUser"
import { Session } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { ListMember } from "../ItemManager"

interface MembersListProps {
  listId: string
  session: Session
}

export const MembersList = ({ listId, session }: MembersListProps) => {
  const [users, setUsers] = useState<ListMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleRoleChange = async (user: ListMember, newRole: "editor" | "viewer") => {
    if (user.role === "owner") {
      console.warn("Cannot change the role of the owner.", user)
      return
    }

    let error: string | null = null

    if (user.pending) {
      // Update invite
      const res = await updateListInvite({
        listId,
        email: user.email!,
        newRole
      })
      error = res.error
    } else {
      // Update list user
      const res = await updateListUser({
        listId,
        userId: user.userId!,
        session,
        newRole
      })
      error = res.error
    }

    if (error) {
      console.error("Error updating role:", error)
      return
    }
    setUsers(prev =>
      prev.map(u => ((user.pending && u.email === user.email) || (!user.pending && u.userId === user.userId) ? { ...u, role: newRole } : u))
    )
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
        email: user.email as string
      })
      error = res.error
    } else {
      const res = await deleteListUser({
        listId,
        userId: user.userId as string
      })
      error = res.error
    }

    if (error) {
      console.error(error)
      return
    }

    setUsers(prev => prev.filter(u => (user.pending ? u.email !== user.email : u.userId !== user.userId)))
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

  const members = [...users.filter(u => !u.pending && u.role !== "owner")].reverse()
  const invited = [...users.filter(u => u.pending && u.role !== "owner")].reverse()

  return (
    <div className="flex flex-col gap-2">
      {/* Members */}
      {members.length > 0 && (
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-gray-400 uppercase text-center">Members</h3>

          {members.map(user => (
            <div key={user.userId} className="flex flex-col border rounded p-2">
              <span className="wrap-break-word">{user.username ?? "Anon"}</span>

              <div className="flex items-center justify-between gap-2">
                <span>
                  <span>Role:</span>
                  <select
                    value={user.role ?? "viewer"} //TODO figure out union type in schema
                    name="member-role"
                    onChange={e => handleRoleChange(user, e.target.value as "editor" | "viewer")}
                    className="border rounded ml-1 px-0.5 py-1 bg-gray-900"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </span>

                <button onClick={() => handleDelete(user)} className="border border-red-500 rounded text-red-500 px-2 py-1">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invited */}
      {invited.length > 0 && (
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-gray-400 uppercase text-center">Invited</h3>

          {invited.map(user => (
            <div key={user.email} className="flex flex-col border rounded p-2 opacity-75">
              <span className="wrap-break-word">{user.email}</span>

              <div className="flex items-center justify-between gap-2">
                <span>
                  <span>Role:</span>
                  <select
                    value={user.role ?? "viewer"} //TODO figure out union type in schema
                    name="invited-role"
                    onChange={e => handleRoleChange(user, e.target.value as "editor" | "viewer")}
                    className="border rounded ml-1 px-0.5 py-1 bg-gray-900"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </span>

                <button onClick={() => handleDelete(user)} className="border border-red-500 rounded text-red-500 px-2 py-1">
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
