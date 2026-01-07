import { ProfileSelector } from './ProfileSelector';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              My Ideals - Idol Namashashin Tracking
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <ProfileSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}
