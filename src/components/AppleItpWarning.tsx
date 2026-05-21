import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari legacy flag (still present on home-screen-launched PWAs)
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

const isItpAffected = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  // Installed PWAs on iOS is not subject to the ITP 7-day eviction rule
  if (isStandalonePWA()) return false;

  const ua = navigator.userAgent;

  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || // iPadOS 13+ would fake its User-Agent to macOS
    (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua)) // Safari on macOS
  );
};

export function AppleItpWarning() {
  const { t } = useTranslation();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('ios-itp-warning-dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (!isItpAffected() || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('ios-itp-warning-dismissed', 'true');
  };

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
        onClick={handleDismiss}
        className="shrink-0 rounded p-1 text-amber-600 transition-colors hover:bg-amber-100
          hover:text-amber-800"
        aria-label={t('common.close')}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
