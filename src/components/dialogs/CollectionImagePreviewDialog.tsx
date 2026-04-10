import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { shareAPISupported, downloadFile, shareFile } from '@/utils/fileUtils';
import { getErrorMessage } from '@/utils/error';
import { toast } from 'sonner';

type CollectionImagePreviewDialogProps = {
  onClose: () => void;
  image: Blob;
  fileName: string;
};

export function CollectionImagePreviewDialog({
  onClose,
  image,
  fileName,
}: CollectionImagePreviewDialogProps) {
  const { t } = useTranslation();

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useLayoutEffect(() => {
    const url = URL.createObjectURL(image);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setImageUrl(null);
    };
  }, [image]);

  const handleImageActions = async (value: string) => {
    const file = new File([image], fileName, { type: image.type });
    if (value === 'download') {
      downloadFile(file);
    }
    if (value === 'share') {
      if (!shareAPISupported) return;
      try {
        await shareFile(file);
      } catch (e) {
        toast.error(t('toast.error', { error: getErrorMessage(e) }));
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
          disabled: !shareAPISupported,
        },
        { label: t('common.close'), value: 'close', variant: 'secondary' },
      ]}
      onCancel={onClose}
      onSelect={handleImageActions}
    >
      <div className="max-h-[70vh] overflow-auto">
        <p className="mb-2 text-sm text-gray-500">{t('dialog.collection-image-preview.hint')}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={t('dialog.collection-image-preview.image-alt', { name: fileName })}
            className="mx-auto h-auto max-w-full rounded-md border border-gray-200"
            style={{ WebkitTouchCallout: 'default' }}
          />
        )}
      </div>
    </ConfirmDialog>
  );
}
