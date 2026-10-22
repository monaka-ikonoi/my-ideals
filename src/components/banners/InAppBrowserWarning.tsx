import { useTranslation } from 'react-i18next';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { isInAppBrowser } from '@/utils/platform';

export function InAppBrowserWarning() {
  const { t } = useTranslation();

  if (!isInAppBrowser()) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm
        text-red-800"
    >
      <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t('notice.in-app-browser-warning.title')}</p>
        <p className="mt-0.5 text-red-700">{t('notice.in-app-browser-warning.body')}</p>
        <p className="mt-0.5 text-red-700">{t('notice.in-app-browser-warning.hint')}</p>
      </div>
    </div>
  );
}
