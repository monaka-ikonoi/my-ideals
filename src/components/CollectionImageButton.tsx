import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TemplateCollection } from '@/domain/template';
import { useDialogStore } from '@/stores/dialogStore';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { CollectionGrid } from './CollectionGrid';
import { OffscreenCaptureArea, type CaptureResult } from './ui/OffscreenCaptureArea';
import { APP_NAME, LONG_VERSION } from '@/utils/appInfo';
import { PhotoIcon } from '@heroicons/react/24/outline';

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
        <div className="bg-white text-gray-900">
          {/* Header */}
          <div className="px-8 pt-6">
            <h1 className="text-3xl leading-tight font-bold">{collection.name}</h1>
            <p className="mt-1 text-xl font-medium text-gray-700">{templateName}</p>
          </div>

          {/* Grid */}
          <div className="px-8 py-4">
            <CollectionGrid collection={collection} mode="export" />
          </div>

          {/* Footer meta: left / right */}
          <div className="text-md px-8 pb-4 text-gray-500">
            <div className="grid grid-cols-[1fr_auto] items-end gap-4">
              <div>
                Template: {templateId} / Collection: {collection.id} / Profile: {profileId}
              </div>
              <div className="text-right whitespace-nowrap">
                {APP_NAME} {LONG_VERSION} / {window.location.hostname} /{' '}
                {new Date().toLocaleString(i18n.language, { timeZoneName: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </OffscreenCaptureArea>
    </>
  );
}
