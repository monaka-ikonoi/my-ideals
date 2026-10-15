import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowUpOnSquareIcon,
  ArrowDownTrayIcon,
  Bars3BottomLeftIcon,
  ClipboardDocumentIcon,
  EllipsisHorizontalCircleIcon,
} from '@heroicons/react/24/outline';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useProfileExporter } from '@/hooks/useProfileExporter';
import { isIos3rdParty } from '@/utils/platform';
import { getErrorMessage } from '@/utils/error';

export function IosInstallGuideDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { canExport, exportProfileBundle } = useProfileExporter();
  const safariUrl =
    window.location.protocol === 'https:' ? `x-safari-${window.location.href}` : null;

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
      <div className="max-h-[60vh] space-y-3 overflow-y-auto">
        {canExport && (
          <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-blue-800">{t('dialog.install-app-ios.data-warning')}</p>
            <button
              type="button"
              onClick={() => exportProfileBundle()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4
                py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('profile.export-all')}
            </button>
          </div>
        )}

        <ol className="list-decimal space-y-2 pl-5">
          {isIos3rdParty() && (
            <li>
              {t('dialog.install-app-ios.step1')}
              <div className="mt-1 space-y-1.5">
                <p className="text-xs text-gray-500">{t('dialog.install-app-ios.step1-hint')}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    aria-label={t('dialog.install-app-ios.copy-url')}
                    title={t('dialog.install-app-ios.copy-url')}
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-gray-100 px-3
                      py-2 text-left text-xs text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    <span className="min-w-0 flex-1 truncate">{window.location.href}</span>
                    <ClipboardDocumentIcon className="h-4 w-4 shrink-0" />
                  </button>
                  {safariUrl && (
                    <a
                      href={safariUrl}
                      className="flex shrink-0 items-center justify-center rounded-lg bg-blue-600
                        px-3 py-2 text-sm font-medium whitespace-nowrap text-white
                        hover:bg-blue-700"
                    >
                      {t('dialog.install-app-ios.open-in-safari')}
                    </a>
                  )}
                </div>
              </div>
            </li>
          )}
          <li>
            <Trans
              i18nKey="dialog.install-app-ios.step2"
              components={{
                share: <ArrowUpOnSquareIcon className="ml-1 inline h-4 w-4 align-text-bottom" />,
              }}
            />
            <p className="mt-1 text-xs text-gray-500">
              <Trans
                i18nKey="dialog.install-app-ios.step2-hint"
                components={{
                  share: <ArrowUpOnSquareIcon className="ml-1 inline h-4 w-4 align-text-bottom" />,
                  more: (
                    <EllipsisHorizontalCircleIcon className="ml-1 inline h-4 w-4 align-text-bottom" />
                  ),
                  pageMenu: (
                    <Bars3BottomLeftIcon className="ml-1 inline h-4 w-4 align-text-bottom" />
                  ),
                }}
              />
            </p>
          </li>
          <li>
            {t('dialog.install-app-ios.step3')}
            <p className="mt-1 text-xs text-gray-500">{t('dialog.install-app-ios.step3-hint')}</p>
          </li>
          <li>
            {t('dialog.install-app-ios.step4')}
            <p className="mt-1 text-xs text-gray-500">{t('dialog.install-app-ios.step4-hint')}</p>
          </li>
        </ol>
      </div>
    </ConfirmDialog>
  );
}
