import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '@/stores/settingsStore';
import { isIos, isMacSafari, isStandalonePWA } from '@/utils/platform';

const isItpAffected = () => !isStandalonePWA() && (isIos() || isMacSafari());

export function AppleItpWarning() {
  const { t } = useTranslation();

  const dismissed = useSettingsStore(state => state.itpWarningDismissed);

  if (!isItpAffected() || dismissed) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3
        text-sm text-amber-800"
    >
      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t('notice.ios-data-warning.title')}</p>
        <p className="mt-0.5 text-amber-700">{t('notice.ios-data-warning.body')}</p>
      </div>

      <button
        type="button"
        onClick={() => useSettingsStore.getState().dismissItpWarning()}
        className="shrink-0 rounded p-1 text-amber-600 transition-colors hover:bg-amber-100
          hover:text-amber-800"
        aria-label={t('common.close')}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
