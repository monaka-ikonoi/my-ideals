import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { CollectionStatusFilter } from './CollectionStatusFilter';
import type { FilterItemStatus } from '@/hooks/useFilteredCollection';
import { MemberSelector } from './MemberSelector';

type SearchBoxProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchSuggestions: string[];
};

function CollectionSearchBox({ searchQuery, setSearchQuery, searchSuggestions }: SearchBoxProps) {
  const { t } = useTranslation();

  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const listRef = useRef<HTMLDivElement | null>(null);

  const showSuggestions =
    openSuggestions && searchQuery.trim().length > 0 && searchSuggestions.length > 0;
  const activeIndex = selectedIndex >= searchSuggestions.length ? -1 : selectedIndex;

  const handleSelectSuggestion = (value: string) => {
    setSearchQuery(value);
    setOpenSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyboardActions = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!showSuggestions) {
          setOpenSuggestions(true);
          setSelectedIndex(0);
          return;
        }
        setSelectedIndex(prev => (prev < searchSuggestions.length - 1 ? prev + 1 : 0));
        return;
      case 'ArrowUp':
        e.preventDefault();
        if (!showSuggestions) {
          setOpenSuggestions(true);
          setSelectedIndex(searchSuggestions.length - 1);
          return;
        }
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchSuggestions.length - 1));
        return;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          setSearchQuery(searchSuggestions[activeIndex]);
        }
        setOpenSuggestions(false);
        setSelectedIndex(-1);
        e.currentTarget.blur();
        return;
      case 'Escape':
        setOpenSuggestions(false);
        setSelectedIndex(-1);
        return;
    }
  };

  useEffect(() => {
    if (!showSuggestions || activeIndex < 0 || !listRef.current) return;

    const activeElement = listRef.current.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, showSuggestions]);

  return (
    <div className="relative flex-1">
      <MagnifyingGlassIcon
        className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={searchQuery}
        onChange={e => {
          setSearchQuery(e.target.value);
          setOpenSuggestions(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setOpenSuggestions(true)}
        onBlur={() => {
          setOpenSuggestions(false);
          setSelectedIndex(-1);
        }}
        onKeyDown={handleKeyboardActions}
        placeholder={t('collection.search-placeholder')}
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={showSuggestions ? 'collection-search-suggestions' : undefined}
        aria-autocomplete="list"
        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-10 pl-10 text-base
          focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none
          sm:text-sm"
      />

      {searchQuery && (
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            setSearchQuery('');
            setOpenSuggestions(false);
            setSelectedIndex(-1);
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}

      {showSuggestions && (
        <div
          ref={listRef}
          onMouseDown={e => e.preventDefault()}
          id="collection-search-suggestions"
          role="listbox"
          className="thin-scrollbar absolute z-20 mt-1 max-h-60 w-full overflow-y-auto
            overscroll-contain rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <div className="py-1">
            {searchSuggestions.map((suggestion, index) => {
              const active = index === selectedIndex;

              return (
                <button
                  key={`${suggestion}-${index}`}
                  data-index={index}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={e => {
                    e.preventDefault();
                    handleSelectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition
                  ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="truncate">{suggestion}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type CollectionFilterProps = {
  searchProps: SearchBoxProps;
  hideCompleted: boolean;
  setHideCompleted: (enabled: boolean) => void;
  hiddenCount: number;
  filterStatus: FilterItemStatus;
  setFilterStatus: (status: FilterItemStatus) => void;
};

export function CollectionFilter({
  searchProps,
  hideCompleted,
  setHideCompleted,
  filterStatus,
  setFilterStatus,
  hiddenCount,
}: CollectionFilterProps) {
  const { t } = useTranslation();

  const members = useActiveProfileStore(state => state.template!.members);
  const selectedMembers = useActiveProfileStore(state => state.profile!.selectedMembers);
  const toggleMember = useActiveProfileStore(state => state.toggleMember);

  return (
    <div className="space-y-3">
      {members.length > 1 && (
        <>
          <div className="flex flex-wrap gap-2">
            <MemberSelector
              members={members}
              isSelected={m => selectedMembers.includes(m)}
              onSelect={m => toggleMember(m)}
            />
          </div>

          <div className="border-t border-gray-200" />
        </>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <CollectionSearchBox {...searchProps} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={e => setHideCompleted(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {t('collection.hide-completed')}
              <span
                className={`tabular-nums ${hiddenCount > 0 ? 'visible' : 'invisible'}`}
              >{` (${hiddenCount})`}</span>
            </span>
          </label>

          <CollectionStatusFilter value={filterStatus} setValue={setFilterStatus} />
        </div>
      </div>
    </div>
  );
}
