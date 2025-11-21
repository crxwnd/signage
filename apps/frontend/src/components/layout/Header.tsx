/**
 * Header Component
 * Top navigation bar for dashboard layout
 */

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Digital Signage System</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* User menu, notifications, etc. will be added in future tasks */}
        </div>
      </div>
    </header>
  );
}
