import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DevicePhoneMobileIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useDialogStore } from '@/stores/dialogStore';
import { isIos, isAndroid, isStandalonePWA } from '@/utils/platform';

const DISMISS_KEY = 'install-app-banner-dismissed';

export function InstallAppBanner() {
  const { t } = useTranslation();
  const { canInstall, promptInstall } = useInstallPrompt();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const installCapable = isIos() || (isAndroid() && canInstall);

  if (dismissed || isStandalonePWA() || !installCapable) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3
        text-sm text-blue-800"
    >
      <DevicePhoneMobileIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t('notice.install-app.title')}</p>
        <p className="mt-0.5 text-blue-700">{t('notice.install-app.hint')}</p>
        <button
          type="button"
          onClick={() =>
            isIos() ? useDialogStore.getState().openInstallAppIos() : void promptInstall()
          }
          className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white
            hover:bg-blue-700"
        >
          {t('notice.install-app.button')}
        </button>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded p-1 text-blue-800 transition-colors hover:text-blue-900"
        aria-label={t('common.close')}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
