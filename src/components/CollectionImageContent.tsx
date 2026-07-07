import type { TemplateCollection } from '@/domain/template';
import { CollectionGrid } from './CollectionGrid';
import { type ImageOptions } from '@/stores/settingsStore';
import { APP_NAME, LONG_VERSION } from '@/utils/appInfo';

type CollectionImageContentProps = {
  templateName: string;
  templateId: string;
  profileId: string;
  collections: TemplateCollection[];
  captureTime: string;
  imageOptions?: ImageOptions;
};

export function CollectionImageContent({
  templateName,
  templateId,
  profileId,
  collections,
  captureTime,
  imageOptions,
}: CollectionImageContentProps) {
  const singleCollection = collections.length === 1;

  return (
    <div className="bg-white text-gray-900">
      <div className="px-8 pt-6">
        <h1 className="text-3xl leading-tight font-semibold">
          {singleCollection ? collections[0].name : templateName}
        </h1>
      </div>

      {collections.map(collection => (
        <div key={collection.id} className="px-8">
          {singleCollection ? (
            <p className="mt-1 text-xl font-medium text-gray-700">{templateName}</p>
          ) : (
            <h2 className="mt-2 text-2xl font-semibold">{collection.name}</h2>
          )}

          <div className="py-4">
            <CollectionGrid collection={collection} mode="export" imageOptions={imageOptions} />
          </div>
        </div>
      ))}

      {/* Footer meta: left / right */}
      <div className="text-md px-8 pb-4 text-gray-500">
        <div className="grid grid-cols-[1fr_auto] items-end gap-4">
          <div>
            {`Template: ${templateId} / ${singleCollection ? `Collection: ${collections[0].id} / ` : ''} Profile: ${profileId}`}
          </div>
          <div className="text-right whitespace-nowrap">
            {APP_NAME} {LONG_VERSION} / {window.location.hostname} / {captureTime}
          </div>
        </div>
      </div>
    </div>
  );
}
