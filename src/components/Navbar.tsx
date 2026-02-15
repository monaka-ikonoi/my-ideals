import { useTranslation } from 'react-i18next';
import { ProfileSelector } from './ProfileSelector';

export function Navbar() {
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto px-4 lg:max-w-[1024px] 2xl:max-w-[1664px]">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-gray-900">
              <span className="sm:hidden">
                {import.meta.env.DEV && <span className="mr-1">[DEV]</span>}
                {t('app.name')}
              </span>
              <span className="hidden sm:inline">
                {import.meta.env.DEV && <span className="mr-1">[DEV]</span>}
                {t('app.name')} - {t('app.tagline')}
              </span>
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
