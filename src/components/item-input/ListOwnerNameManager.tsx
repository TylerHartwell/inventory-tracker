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

  const handleUpdateName = async () => {
    if (!currentList || !newName.trim() || !isOwner) return
    const { error } = await updateList({
      list: currentList,
      updates: { name: newName.trim() }
    })
    if (error) {
      console.error(error)
      return
    }

    onFinish()
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={newName}
        name="list-name"
        placeholder="List Name"
        onChange={e => setNewName(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault()
            handleUpdateName()
          }
        }}
        className="flex-1 px-2 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring"
        autoFocus
      />
      <button onClick={handleUpdateName} className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-800">
        Save
      </button>
    </div>
  )
}

export default ListOwnerNameManager
