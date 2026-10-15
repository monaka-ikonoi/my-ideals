import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useProfileExporter } from '@/hooks/useProfileExporter';
import { useProfileListStore } from '@/stores/profileListStore';
import { getErrorMessage } from '@/utils/error';
import { shareAPISupported, shareFile } from '@/utils/fileUtils';
import { isTwitterInAppBrowser } from '@/utils/platform';

export function TwitterBrowserWarning() {
  const { t } = useTranslation();
  const hasProfiles = useProfileListStore(state => state.profiles.length > 0);
  const { exporting, prepareProfileBundle } = useProfileExporter();
  const [file, setFile] = useState<File | null>(null);
  const [sharing, setSharing] = useState(false);

  const handlePrepare = async () => {
    try {
      const backup = await prepareProfileBundle();
      if (backup) setFile(backup);
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  };

  const handleShare = async () => {
    if (!file || sharing) return;

    try {
      if (!shareAPISupported || !navigator.canShare({ files: [file] })) {
        toast.error(t('dialog.profile-share.unsupported'));
        return;
      }

      setSharing(true);
      // Share on a fresh click, after asynchronous backup preparation has finished.
      await shareFile(file);
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    } finally {
      setSharing(false);
    }
  };

  if (!isTwitterInAppBrowser()) return null;

  return (
    <>
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-4
          text-sm text-red-900 shadow-sm"
      >
        <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold">{t('notice.twitter-browser-warning.title')}</p>
          <p className="mt-1">{t('notice.twitter-browser-warning.body')}</p>
          <p className="mt-2 font-semibold">{t('notice.twitter-browser-warning.hint')}</p>
          {hasProfiles && (
            <div className="mt-3 border-t border-red-200 pt-3">
              <p>{t('notice.twitter-browser-warning.backup-hint')}</p>
              <button
                type="button"
                onClick={() => void handlePrepare()}
                disabled={exporting}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2
                  font-semibold text-white hover:bg-red-700 disabled:cursor-wait
                  disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
                {exporting ? t('common.loading') : t('profile.export-all')}
              </button>
            </div>
          )}
        </div>
      </div>
      {file && (
        <ConfirmDialog
          isOpen
          title={t('profile.export-all')}
          onCancel={() => setFile(null)}
          onSelect={value => {
            if (value === 'share') void handleShare();
            else setFile(null);
          }}
          showCancel={false}
          options={[
            { label: t('common.close'), value: 'close', disabled: sharing },
            {
              label: t('dialog.profile-share.share-json'),
              value: 'share',
              variant: 'primary',
              disabled: sharing,
            },
          ]}
        >
          <p>{t('dialog.profile-share.hint')}</p>
          <p className="text-xs break-all text-gray-500">{file.name}</p>
        </ConfirmDialog>
      )}
    </>
  );
}
