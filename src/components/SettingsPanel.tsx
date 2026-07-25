import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LanguageSelector } from './LanguageSelector';
import { useDialogStore } from '@/stores/dialogStore';
import {
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  CircleStackIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';
import { DebugSettings } from './DebugSettings';
import { formatBytes } from '@/utils/utils';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { isAndroid, isIos, isStandalonePWA } from '@/utils/platform';

const RUNTIME_CACHE_PREFIX = 'my-ideals-';

async function getStorageUsage(): Promise<StorageEstimate | null> {
  return navigator.storage?.estimate?.() ?? null;
}

type SettingsPanelProps = {
  onSelect?: () => void;
};

export function SettingsPanel({ onSelect }: SettingsPanelProps) {
  const { t, i18n } = useTranslation();
  const { canInstall, promptInstall } = useInstallPrompt();

  const [storageUsage, setStorageUsage] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    void getStorageUsage().then(setStorageUsage);
  }, []);

  const handleClearCache = async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key.startsWith(RUNTIME_CACHE_PREFIX)).map(key => caches.delete(key))
    );
    setStorageUsage(await getStorageUsage());
    toast.success(t('toast.cache-cleared'));
  };

  const installCapable = isIos() || (isAndroid() && canInstall);
  const showInstall = !isStandalonePWA() && installCapable;

  const handleInstall = () => {
    if (isIos()) {
      useDialogStore.getState().openInstallAppIos();
    } else {
      void promptInstall();
    }
    onSelect?.();
  };

  return (
    <>
      <div className="py-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
          {t('settings.language')}
        </div>

        <LanguageSelector onSelect={onSelect} />
      </div>

      <div className="border-t border-gray-200" />

      <div className="py-1">
        <a
          href={`https://github.com/monaka-ikonoi/my-ideals/blob/main/README.${i18n.language}.md`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onSelect?.()}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <QuestionMarkCircleIcon className="h-4 w-4" />
          {t('settings.help')}
          <ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 text-gray-400" />
        </a>
        <button
          onClick={() => {
            useDialogStore.getState().openAbout();
            onSelect?.();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <InformationCircleIcon className="h-4 w-4" />
          {t('dialog.about.title')}
        </button>
        {showInstall && (
          <button
            onClick={handleInstall}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
              hover:bg-gray-100"
          >
            <SquaresPlusIcon className="h-4 w-4" />
            {t('notice.install-app.title')}
          </button>
        )}
        <button
          onClick={() => void handleClearCache()}
          className="flex w-full items-start gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <CircleStackIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex flex-col items-start">
            <span>{t('settings.clear-cache')}</span>
            {storageUsage !== null && (
              <span className="text-xs text-gray-400">
                {t('settings.storage-usage', {
                  size: formatBytes(storageUsage.usage ?? 0),
                  quota: formatBytes(storageUsage.quota ?? 0),
                })}
              </span>
            )}
          </span>
        </button>
      </div>

      <DebugSettings onSelect={onSelect} />
    </>
  );
}
