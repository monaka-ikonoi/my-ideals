import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TemplateCollection } from '@/domain/template';
import { getPrimaryField } from '@/domain/profile';
import { DEFAULT_IMAGE_OPTIONS, ImageOptionsContext } from '@/contexts/imageOptions';
import { useTemplate } from '@/contexts/template';
import { useActiveProfile } from '@/stores/profileSessionStore';
import { useCollectionStats } from '@/hooks/useStats';
import { FullScreenModal } from '../ui/FullScreenModal';
import { MemberSelector } from '../MemberSelector';
import { CollectionGrid } from '../CollectionGrid';
import { type BadgeProps } from '../card/CountBadgeProps';

const EDIT_BADGE: BadgeProps = { size: 'xlarge', position: 'bottom-middle' };

type CollectionEditModalProps = {
  collectionId: string;
  onClose: () => void;
};

export function CollectionEditModal({ collectionId, onClose }: CollectionEditModalProps) {
  const { t } = useTranslation();

  const allMembers = useTemplate().members;
  const collection = useTemplate().collections.find(c => c.id === collectionId)!;

  const availableMembers = useMemo(() => {
    const members = new Set<string>();

    collection.items.forEach(item => {
      if (typeof item.member === 'string') {
        members.add(item.member);
      } else if (Array.isArray(item.member)) {
        item.member.forEach(m => members.add(m));
      }
    });

    return allMembers.filter(m => members.has(m.id));
  }, [collection.items, allMembers]);

  const [selectedMember, setSelectedMember] = useState<string | undefined>(availableMembers[0]?.id);

  const fields = useActiveProfile(state => state.fields);
  const recordMode = useActiveProfile(state => state.profile.mode);
  const editImageOptions = useMemo(
    () => ({
      ...DEFAULT_IMAGE_OPTIONS,
      badges: recordMode === 'standard' ? {} : { [getPrimaryField(fields).id]: EDIT_BADGE },
    }),
    [fields, recordMode]
  );

  const virtualCollection = useMemo((): TemplateCollection => {
    if (availableMembers.length === 0 || !selectedMember) return collection;

    return {
      ...collection,
      items: collection.items.filter(item => {
        if (typeof item.member === 'string') return item.member === selectedMember;
        if (Array.isArray(item.member)) return item.member.includes(selectedMember);
        return false;
      }),
    };
  }, [availableMembers.length, collection, selectedMember]);

  const stats = useCollectionStats(collection);

  return (
    <FullScreenModal
      isOpen
      title={t('dialog.collection-edit.title', { name: collection.name })}
      onClose={onClose}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {availableMembers.length > 1 && (
          <>
            <div className="flex shrink-0 flex-wrap gap-2 px-4 pt-3 pb-3 sm:px-6">
              <MemberSelector
                members={availableMembers}
                isSelected={id => id === selectedMember}
                onSelect={id => setSelectedMember(id)}
              />
            </div>
            <div className="border-t border-gray-100" />
          </>
        )}

        {virtualCollection.items.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:px-6">
              <ImageOptionsContext value={editImageOptions}>
                <CollectionGrid collection={virtualCollection} columns={[3, 6, 6]} mode="edit" />
              </ImageOptionsContext>
            </div>
          </div>
        )}

        <div className="shrink-0 border-t border-gray-100 px-4 py-2 text-sm text-gray-500 sm:px-6">
          {t('dialog.collection-edit.stats', { owned: stats.items.owned })}
        </div>
      </div>
    </FullScreenModal>
  );
}
