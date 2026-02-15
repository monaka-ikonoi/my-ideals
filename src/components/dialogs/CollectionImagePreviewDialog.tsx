import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useMemo } from 'react';

type CollectionImagePreviewDialogProps = {
  onClose: () => void;
  imageUrl: string;
  fileName: string;
};

export function CollectionImagePreviewDialog({
  onClose,
  imageUrl,
  fileName,
}: CollectionImagePreviewDialogProps) {
  const { t } = useTranslation();

  const canUseWebShare = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
  }, []);

  const handleImageActions = async (value: string) => {
    if (value === 'download') {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = fileName;
      a.click();
    }
    if (value === 'share') {
      if (!canUseWebShare) return;

      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      }
    }
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen
      title={t('dialog.collection-image-preview.title')}
      showCancel={false}
      options={[
        { label: t('common.download'), value: 'download', variant: 'secondary' },
        {
          label: t('common.share'),
          value: 'share',
          variant: 'secondary',
          disabled: !canUseWebShare,
        },
        { label: t('common.close'), value: 'close', variant: 'secondary' },
      ]}
      onCancel={onClose}
      onSelect={handleImageActions}
    >
      <div className="max-h-[70vh] overflow-auto">
        <p className="mb-2 text-sm text-gray-500">{t('dialog.collection-image-preview.hint')}</p>
        <img
          src={imageUrl}
          alt={t('dialog.collection-image-preview.image-alt', { name: fileName })}
          className="mx-auto h-auto max-w-full rounded-md border border-gray-200 bg-white shadow-lg"
          style={{ WebkitTouchCallout: 'default' }}
        />
      </div>
    </ConfirmDialog>
  );
}
