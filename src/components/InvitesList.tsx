import { useUserInvites } from "@/hooks/useUserInvites"

export function InvitesList() {
  const { invites, loading, error } = useUserInvites()

  if (loading) return <p>Loading invites…</p>
  if (error) return <p>Error: {error}</p>

  if (invites.length === 0) {
    return <span>- No Invites -</span>
  }

  return (
    <ul>
      {invites.map(invite => (
        <li key={invite.id}>
          <div>
            <span>List:</span> {invite.list.name}
            <span>Role:</span> {invite.role}
          </div>
          <span className="flex gap-2 text-xs">
            <button className="border rounded-full px-2 cursor-pointer">accept</button>
            <button className="border rounded-full px-2 cursor-pointer">decline</button>
            <button className="border rounded-full px-2 cursor-pointer">ignore</button>
          </span>
        </li>
      ))}
    </ul>
  )
}
