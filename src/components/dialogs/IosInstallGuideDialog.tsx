import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowUpOnSquareIcon,
  EllipsisHorizontalIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useProfileExporter } from '@/hooks/useProfileExporter';
import { isIos3rdParty } from '@/utils/platform';
import { getErrorMessage } from '@/utils/error';

export function IosInstallGuideDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { canExport, exportProfileBundle } = useProfileExporter();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('toast.url-copied'));
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  };

  return (
    <ConfirmDialog
      isOpen={true}
      title={t('dialog.install-app-ios.title')}
      onCancel={onClose}
      onSelect={onClose}
      showCancel={false}
      options={[{ label: t('common.close'), value: 'close', variant: 'secondary' }]}
    >
      <div className="space-y-3">
        {isIos3rdParty() && (
          <div className="space-y-1.5">
            <p>{t('dialog.install-app-ios.open-in-safari-hint')}</p>
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              className="w-full truncate rounded-lg bg-gray-100 px-3 py-2 text-left text-xs
                text-gray-600 transition-colors hover:bg-gray-200"
            >
              {window.location.href}
            </button>
          </div>
        )}

        <ol className="list-decimal space-y-1 pl-5">
          <li>
            {t('dialog.install-app-ios.step1')}{' '}
            <EllipsisHorizontalIcon className="inline h-4 w-4 align-text-bottom" />
          </li>
          <li>
            {t('dialog.install-app-ios.step2')}{' '}
            <ArrowUpOnSquareIcon className="inline h-4 w-4 align-text-bottom" />
          </li>
          <li>{t('dialog.install-app-ios.step3')}</li>
          <li>{t('dialog.install-app-ios.step4')}</li>
        </ol>

        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
          {t('dialog.install-app-ios.data-warning')}
        </p>

        {canExport && (
          <button
            type="button"
            onClick={() => exportProfileBundle()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4
              py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {t('profile.export-all')}
          </button>
        )}
      </div>
    </ConfirmDialog>
  );
}
