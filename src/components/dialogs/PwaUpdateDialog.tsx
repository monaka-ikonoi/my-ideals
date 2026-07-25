import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LONG_VERSION } from '@/utils/appInfo';
import { debugLog } from '@/utils/debug';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function fetchNewVersion(): Promise<string | null> {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.version;
  } catch {
    return null;
  }
}

export function PwaUpdateDialog() {
  const { t } = useTranslation();

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [incomingVersion, setIncomingVersion] = useState<string | null>(null);

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      registrationRef.current = registration;
      debugLog.network.log('Service worker registered');
    },
    onRegisterError(error) {
      debugLog.network.log('Service worker registration failed', error);
    },
  });

  useEffect(() => {
    const checkForUpdate = () => {
      void registrationRef.current?.update();
    };

    const checkUpdateInterval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', checkForUpdate);

    return () => {
      window.clearInterval(checkUpdateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', checkForUpdate);
    };
  }, []);

  useEffect(() => {
    if (!needRefresh[0]) return;
    void fetchNewVersion().then(setIncomingVersion);
  }, [needRefresh]);

  if (!needRefresh[0]) return null;

  return (
    <ConfirmDialog
      isOpen={true}
      title={t('dialog.pwa-update.title')}
      onCancel={() => needRefresh[1](false)}
      onSelect={() => updateServiceWorker(true)}
      showCancel={true}
      options={[{ label: t('dialog.pwa-update.update'), value: 'update', variant: 'primary' }]}
    >
      <div className="space-y-2">
        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-2 gap-y-1 text-sm">
          <span className="text-gray-500">{t('dialog.pwa-update.current-version')}:</span>
          <span className="font-mono text-gray-600">{LONG_VERSION}</span>
          <span className="text-gray-500">{t('dialog.pwa-update.new-version')}:</span>
          <span className="font-mono text-gray-600">{incomingVersion ?? t('common.unknown')}</span>
        </div>
      </div>
    </ConfirmDialog>
  );
}
