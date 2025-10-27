interface HeaderProps {
  userEmail: string
  onLogout: () => Promise<void>
}

export const Header = ({ userEmail, onLogout }: HeaderProps) => {
  return (
    <div className="flex justify-between items-baseline">
      <h2 className="text-2xl font-semibold">Inventory Tracker</h2>
      <span className="flex items-baseline gap-4">
        <span>{userEmail}</span>
        <button onClick={onLogout} className="rounded-lg bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600 transition-colors">
          Log Out
        </button>
      </span>
    </div>
  )
}
