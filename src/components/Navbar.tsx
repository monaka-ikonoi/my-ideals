import { type ProfileSummary } from '@/storage/localStorage';
import { ProfileSelector } from './ProfileSelector';

type NavbarProps = {
  profiles: ProfileSummary[];
  activeProfile: ProfileSummary | null;
  onSelectProfile: (profileId: string) => void;
};

export function Navbar({ profiles, activeProfile, onSelectProfile }: NavbarProps) {
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
            <ProfileSelector
              profiles={profiles}
              activeProfile={activeProfile ?? null}
              onSelect={onSelectProfile}
              onCreate={() => {}}
              onImport={() => {}}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
