import { useState } from "react"
import { Session } from "@supabase/supabase-js"
import { UserList } from "@/hooks/useUserLists"
import ListOwnerUserManager from "./ListOwnerUserManager"
import ListOwnerNameManager from "./ListOwnerNameManager"

interface Props {
  configId: string
  session: Session
  currentList: UserList | undefined
  isOwner: boolean
  onListDelete: (id: string) => void
  refreshItems: () => Promise<void>
  refreshLists: () => Promise<void>
}

const ListOwnerManager = ({ configId, session, currentList, isOwner, onListDelete, refreshItems, refreshLists }: Props) => {
  const [isManagingUsers, setIsManagingUsers] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)

  const handleIsEditingName = (newValue: boolean) => {
    setIsEditingName(newValue)
  }

  return (
    <>
      {!isEditingName ? (
        <button
          type="button"
          onClick={() => {
            handleIsEditingName(true)
          }}
          className="w-full text-left bg-gray-800 px-2 py-1 rounded hover-fine:outline-1 active:outline-1"
        >
          ✏️ Edit List Name
        </button>
      ) : (
        <ListOwnerNameManager
          currentList={currentList}
          isOwner={isOwner}
          onFinish={() => {
            handleIsEditingName(false)
            refreshItems()
            refreshLists()
          }}
        />
      )}
      {!isManagingUsers ? (
        <button
          type="button"
          onClick={() => {
            setIsManagingUsers(true)
          }}
          className="w-full text-left bg-gray-800 px-2 py-1 rounded hover-fine:outline-1 active:outline-1"
        >
          👥 Manage Users
        </button>
      ) : (
        <ListOwnerUserManager configId={configId} session={session} currentList={currentList} isOwner={isOwner} />
      )}
      <button
        type="button"
        onClick={() => onListDelete(configId)}
        className="w-full text-left bg-red-700 px-2 py-1 rounded hover-fine:outline-1 active:outline-1"
      >
        🗑️ Delete List
      </button>
    </>
  )
}

export default ListOwnerManager
