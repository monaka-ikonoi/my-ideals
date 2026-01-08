import { type WorkingCollectionItem, type WorkingTemplateMeta } from '@/domain/working';
import { urlFromBaseUrl } from '@/domain/template';
import { useWorkingProfileStore } from '@/stores/workingProfileStore';
import { ImageCheckCard } from './ImageCheckCard';

type CollectionPanelProps = {
  id: string;
  name: string;
  items: WorkingCollectionItem[];
};

export function CollectionPanel({ id, name, items }: CollectionPanelProps) {
  const toggleStatus = useWorkingProfileStore(state => state.toggleStatus);
  const template = useWorkingProfileStore(state => state.working!.template);

  const getImageUrl = (
    collectionId: string,
    item: WorkingCollectionItem,
    template: WorkingTemplateMeta
  ): string =>
    template.imageResourceType === 'inline'
      ? item.image!
      : urlFromBaseUrl(`${collectionId}/${item.id}`, template.imageBaseUrl!);

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
        <p className="text-sm text-gray-500">
          {items.filter(i => i.status).length} / {items.length} 収集済み
        </p>
      </div>

      {/* Grid of cards */}
      <div className="p-4">
        <div
          className="mx-auto grid max-w-[360px] grid-cols-3 gap-2 lg:max-w-[960px] lg:grid-cols-6
            lg:gap-4"
        >
          {items.map(item => (
            <ImageCheckCard
              key={`${item.member}-${item.title}`}
              src={getImageUrl(id, item, template)}
              text={item.title}
              checked={item.status}
              onChange={() => toggleStatus(id, item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
