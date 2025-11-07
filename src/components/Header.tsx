interface HeaderProps {
  userEmail: string
  onLogout: () => Promise<void>
}

export const Header = ({ userEmail, onLogout }: HeaderProps) => {
  return (
    <div className="flex justify-end items-baseline text-sm">
      <h2 className="hidden 2xs:block font-semibold grow-1">Inventory Tracker</h2>
      <span className="flex items-baseline justify-between gap-4 ">
        <span>{userEmail}</span>
        <button
          onClick={onLogout}
          className="rounded-lg bg-red-500 px-2 py-1 text-sm text-white hover-fine:outline-1 active:outline-1 transition-colors"
        >
          Log Out
        </button>
      </span>
    </div>
  )
}
