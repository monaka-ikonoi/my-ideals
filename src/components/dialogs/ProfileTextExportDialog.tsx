import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { CompressedBackup } from '@/utils/compressedBackup';
import { formatBytes } from '@/utils/utils';

type ProfileTextExportDialogProps = {
  backup: CompressedBackup;
  onClose: () => void;
};

export function ProfileTextExportDialog({ backup, onClose }: ProfileTextExportDialogProps) {
  const { t } = useTranslation();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [copying, setCopying] = useState(false);

  const selectAll = () => {
    textRef.current?.focus();
    textRef.current?.select();
    textRef.current?.setSelectionRange(0, backup.base64.length);
  };

  const handleCopy = async () => {
    if (copying) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(backup.base64);
      toast.success(t('dialog.profile-text-export.copied'));
    } catch {
      selectAll();
      toast.error(t('dialog.profile-text-export.copy-failed'));
    } finally {
      setCopying(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen
      title={t('dialog.profile-text-export.title')}
      onCancel={onClose}
      showCancel={false}
      onSelect={value => {
        if (value === 'copy') void handleCopy();
        else onClose();
      }}
      options={[
        { label: t('common.close'), value: 'close' },
        {
          label: t('dialog.profile-text-export.copy'),
          value: 'copy',
          variant: 'primary',
          disabled: copying,
        },
      ]}
    >
      <div className="max-h-[60dvh] space-y-3 overflow-y-auto">
        <p>{t('dialog.profile-text-export.hint')}</p>
        <p className="text-xs text-gray-500">
          {t('dialog.profile-text-export.sizes', {
            original: formatBytes(backup.originalBytes),
            compressed: formatBytes(backup.compressedBytes),
            encoded: formatBytes(backup.base64.length),
          })}
        </p>
        <label className="block">
          <span className="mb-1 block font-medium">{t('dialog.profile-text-export.code')}</span>
          <textarea
            ref={textRef}
            readOnly
            value={backup.base64}
            rows={5}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-gray-300 p-2 font-mono text-xs
              break-all focus:border-blue-500 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={selectAll}
          className="rounded-lg bg-gray-100 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-200"
        >
          {t('common.select-all')}
        </button>
      </div>
    </ConfirmDialog>
  );
}
