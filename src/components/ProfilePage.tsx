import { Virtuoso } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';
import { useCollectionFilter } from '@/hooks/useFilteredCollection';
import { CollectionPanel } from './CollectionPanel';
import { CollectionFilter } from './CollectionFilter';
import { ProfileInfo } from './ProfileInfo';
import { ScrollToTop } from './ui/ScrollToTop';
import { ProfileStats } from './ProfileStats';
import { AppleItpWarning } from './AppleItpWarning';

export function ProfilePage() {
  const { t } = useTranslation();

  const { visibleCollections, collectionMap, filterProps, hiddenCount } = useCollectionFilter();

  return (
    <main className="mx-auto max-w-[512px] space-y-6 px-4 py-6 md:max-w-[1024px] 2xl:max-w-[1664px]">
      <AppleItpWarning />
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ProfileInfo />
        <div className="my-4 border-t border-gray-200" />
        <CollectionFilter
          hiddenCount={hiddenCount}
          imageCollections={visibleCollections}
          {...filterProps}
        />
        <div className="my-4 border-t border-gray-200" />
        <ProfileStats visibleCollections={visibleCollections} baseCollectionMap={collectionMap} />
      </div>

      {/* Collections - Virtualized*/}
      <Virtuoso
        data={visibleCollections}
        useWindowScroll
        overscan={3}
        itemContent={(_, collection) => (
          <div className="pb-6">
            <CollectionPanel
              collection={collection}
              baseCollection={collectionMap[collection.id]}
            />
          </div>
        )}
        components={{
          EmptyPlaceholder: () => (
            <div className="flex h-40 items-center justify-center text-gray-500">
              {t('collection.no-result')}
            </div>
          ),
        }}
      />

      <ScrollToTop />
    </main>
  );
}
