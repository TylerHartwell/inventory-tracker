import { Session } from "@supabase/supabase-js"
import { UserList } from "@/hooks/useUserLists"
import { X } from "lucide-react"
import ListOwnerManager from "./ListOwnerManager"

function ListConfigModal({
  onClose,
  configId,
  lists,
  session,
  onListDelete,
  onListLeave,
  nullListName,
  refreshItems,
  refreshLists
}: {
  onClose: () => void
  configId: string
  lists: UserList[]
  session: Session
  onListDelete: (id: string) => void
  onListLeave: (id: string) => Promise<void>
  nullListName: string
  refreshItems: () => Promise<void>
  refreshLists: () => Promise<void>
}) {
  const currentList = lists.find(l => l.id === configId)
  const isOwner = currentList?.role === "owner"

  return (
    <div
      className="fixed inset-0 flex flex-col items-center bg-black/70 z-50"
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="flex flex-col gap-1 bg-gray-700 text-white rounded-lg p-4 w-80 mt-20 relative" onClick={e => e.stopPropagation()}>
        <h2 className="text-md font-semibold">List Settings</h2>
        <p className="text-sm text-gray-400">
          List Name: <strong>{currentList ? currentList.name : nullListName}</strong>
        </p>

        <div className="space-y-2">
          <>
            {isOwner ? (
              <ListOwnerManager
                configId={configId}
                session={session}
                currentList={currentList}
                isOwner={isOwner}
                onListDelete={onListDelete}
                refreshItems={refreshItems}
                refreshLists={refreshLists}
              />
            ) : (
              <button
                type="button"
                onClick={() => onListLeave(configId)}
                className="w-full text-left bg-red-700 px-2 py-1 rounded hover-fine:outline-1 active:outline-1"
                title="Leave list"
              >
                🚪 Leave List
              </button>
            )}
          </>
        </div>

        <button
          type="button"
          className="size-5 flex items-center justify-center absolute top-2 right-2 text-sm text-gray-400 hover-fine:outline-1 active:outline-1"
          onClick={() => onClose()}
          title="Close settings"
        >
          <X />
        </button>
      </div>
    </div>
  )
}

export default ListConfigModal
