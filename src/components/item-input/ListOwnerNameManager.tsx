import { UserList } from "@/hooks/useUserLists"
import { updateList } from "@/utils/list/updateList"
import { useState } from "react"

interface Props {
  currentList: UserList | undefined
  isOwner: boolean
  onFinish: () => void
}

const ListOwnerNameManager = ({ currentList, isOwner, onFinish }: Props) => {
  const [newName, setNewName] = useState(currentList?.name ?? "")
  const [message, setMessage] = useState("")

  const handleUpdateName = async () => {
    if (!currentList || !isOwner) return

    const trimmedName = newName.trim()

    if (!trimmedName) {
      setMessage("List name cannot be empty.")
      return
    }

    if (trimmedName === currentList.name) {
      setMessage("List name is unchanged.")
      return
    }

    setMessage("")

    const { error } = await updateList({
      list: currentList,
      updates: { name: trimmedName }
    })
    if (error) {
      console.error(error)
      setMessage("Unable to update list name. Please try again.")
      return
    }

    onFinish()
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          name="list-name"
          placeholder="List Name"
          onChange={e => {
            setNewName(e.target.value)
            if (message) setMessage("")
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleUpdateName()
            }
          }}
          className="flex-1 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring"
          autoFocus
        />
        <button onClick={handleUpdateName} className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-800" title="Save list name">
          Save
        </button>
      </div>
      {message && <p className="text-sm text-red-400">{message}</p>}
    </div>
  )
}

export default ListOwnerNameManager
