import { useTranslation } from 'react-i18next';
import { PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useDialogStore } from '@/stores/dialogStore';

export function EmptyPage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-[calc(100vh-56px)] items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700">{t('profile.not-selected')}</h2>
        <p className="mt-2 text-gray-500">{t('profile.not-selected-hint')}</p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => useDialogStore.getState().openCreateProfile()}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2
              text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PlusIcon className="h-4 w-4" />
            {t('profile.create')}
          </button>
          <button
            onClick={() => useDialogStore.getState().openImportProfile()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium
              text-white hover:bg-blue-700"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            {t('profile.import')}
          </button>
        </div>
      </div>
    </div>
  );
}
