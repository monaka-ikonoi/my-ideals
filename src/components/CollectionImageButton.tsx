import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TemplateCollection } from '@/domain/template';
import { useDialogStore } from '@/stores/dialogStore';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { OffscreenCaptureArea, type CaptureResult } from './ui/OffscreenCaptureArea';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { CollectionImageContent } from './CollectionImageContent';

type CollectionImageButtonProps = {
  collection: TemplateCollection;
};

export function CollectionImageButton({ collection }: CollectionImageButtonProps) {
  const { t, i18n } = useTranslation();

  const [generating, setGenerating] = useState(false);

  const templateName = useActiveProfileStore(state => state.template!.name);
  const templateId = useActiveProfileStore(state => state.template!.id);
  const profileId = useActiveProfileStore(state => state.profile!.id);
  const fileName = `${templateId}-${collection.id}.png`;

  const handleCapture = useCallback(
    (result: CaptureResult) => {
      setGenerating(false);

      if (result.success) {
        useDialogStore.getState().openCollectionImagePreview(result.blob, fileName);
      } else {
        console.error('Capture failed:', result.error);
      }
    },
    [fileName]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setGenerating(true)}
        disabled={generating}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title={t('collection.generate-image')}
      >
        {generating ? (
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"
          />
        ) : (
          <PhotoIcon className="h-4 w-4" />
        )}
      </button>

      <OffscreenCaptureArea active={generating} onComplete={handleCapture} width={1664}>
        <CollectionImageContent
          templateName={templateName}
          templateId={templateId}
          profileId={profileId}
          collections={[collection]}
          captureTime={new Date().toLocaleString(i18n.language, { timeZoneName: 'short' })}
        />
      </OffscreenCaptureArea>
    </>
  );
}
