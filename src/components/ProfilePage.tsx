import { Virtuoso } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';
import { useCollectionFilter } from '@/hooks/useFilteredCollection';
import { useSearch } from '@/hooks/useSearch';
import { CollectionPanel } from './CollectionPanel';
import { CollectionFilter } from './CollectionFilter';
import { ProfileInfo } from './ProfileInfo';
import { ScrollToTop } from './ui/ScrollToTop';
import { ProfileStats } from './ProfileStats';
import { AppleItpWarning } from './AppleItpWarning';
import { NotEqualMeBanner } from './NotEqualMeBanner';
import { InstallAppBanner } from './InstallAppBanner';

export function ProfilePage() {
  const { t } = useTranslation();

  const { visibleCollections, collectionMap, filterProps, hiddenCount } = useCollectionFilter();
  const { searchedCollections, searchProps } = useSearch(visibleCollections);

  return (
    <main className="mx-auto max-w-[512px] space-y-6 px-4 py-6 md:max-w-[1024px] 2xl:max-w-[1664px]">
      <InstallAppBanner />
      <AppleItpWarning />
      <NotEqualMeBanner />
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ProfileInfo />
        <div className="my-4 border-t border-gray-200" />
        <CollectionFilter
          hiddenCount={hiddenCount}
          imageCollections={searchedCollections}
          searchProps={searchProps}
          {...filterProps}
        />
        <div className="my-4 border-t border-gray-200" />
        <ProfileStats visibleCollections={searchedCollections} baseCollectionMap={collectionMap} />
      </div>

      {/* Collections - Virtualized*/}
      <Virtuoso
        data={searchedCollections}
        useWindowScroll
        overscan={3}
        computeItemKey={(_, collection) => collection.id}
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
