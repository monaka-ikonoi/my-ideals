import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Template } from '@/domain/template';
import type { ProfileTemplateDiff, CollectionChange } from '@/utils/syncProfile';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ConfirmDialog } from './ui/ConfirmDialog';

function CollectionTree({
  collection,
  type,
}: {
  collection: CollectionChange;
  type: 'added' | 'removed';
}) {
  const [expanded, setExpanded] = useState(false);

  const styles = {
    added: {
      text: 'text-green-700',
      hover: 'hover:bg-green-50',
      bullet: 'text-green-500',
    },
    removed: {
      text: 'text-red-700',
      hover: 'hover:bg-red-50',
      bullet: 'text-red-500',
    },
  };

  const style = styles[type];

  return (
    <div className="text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex w-full items-center gap-1 rounded px-2 py-1 ${style.hover}`}
      >
        {expanded ? (
          <ChevronDownIcon className={`h-4 w-4 ${style.bullet}`} />
        ) : (
          <ChevronRightIcon className={`h-4 w-4 ${style.bullet}`} />
        )}
        <span className={`${style.text} truncate`}>
          {collection.name && <>{collection.name} / </>}
          <span className={`${style.text} font-mono`}>{collection.id}</span>
        </span>
        <span className="text-gray-400">({collection.items.length})</span>
      </button>

      {expanded && (
        <ul className="mt-1 ml-8 space-y-0.5">
          {collection.items.map(item => (
            <li key={item.id} className={`${style.text} truncate`}>
              {type === 'added' ? '+' : '-'}
              {item.name && <>{item.name} /</>}
              <span className="font-mono"> {item.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileTemplateDiffContent({
  template,
  changes,
}: {
  template: Template;
  changes: ProfileTemplateDiff | null;
}) {
  if (!changes) return null;

  const totalAdded = changes.added.reduce((sum, c) => sum + c.items.length, 0);
  const totalRemoved = changes.removed.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Template <strong>{template.name}</strong> has been updated to revision {template.revision}{' '}
        with following changes
      </p>

      {/* Added */}
      {changes.added.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-medium text-green-700">
            + {totalAdded} item(s) added
          </div>
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {changes.added.map(collection => (
              <CollectionTree key={collection.id} collection={collection} type="added" />
            ))}
          </div>
        </div>
      )}

      {/* Removed */}
      {changes.removed.length > 0 && (
        <>
          <div>
            <div className="mb-2 text-sm font-medium text-red-700">
              - {totalRemoved} item(s) removed
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {changes.removed.map(collection => (
                <CollectionTree key={collection.id} collection={collection} type="removed" />
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Choose whether to keep removed items in your profile or clean them up.
          </div>
        </>
      )}
    </div>
  );
}

export function ProfileTemplateDiffDialog() {
  const template = useActiveProfileStore(state => state.template!);
  const changes = useActiveProfileStore(state => state.changes);
  const confirmSyncChanges = useActiveProfileStore(state => state.confirmSyncChanges);

  const hasChanges = changes && (changes.added.length > 0 || changes.removed.length > 0);
  const hasRemovals = changes && changes.removed.length > 0;

  const handleSelect = (value: string) => {
    if (value === 'cleanup') {
      confirmSyncChanges(true);
    } else {
      confirmSyncChanges(false);
    }
  };

  const options = hasRemovals
    ? [
        { label: 'Keep removed data', value: 'keep', variant: 'secondary' as const },
        { label: 'Clean up', value: 'cleanup', variant: 'danger' as const },
      ]
    : [{ label: 'Got it', value: 'ok', variant: 'primary' as const }];

  return createPortal(
    <ConfirmDialog
      isOpen={!!hasChanges}
      title="Template Updated"
      message={<ProfileTemplateDiffContent template={template} changes={changes} />}
      options={options}
      showCancel={false}
      onSelect={handleSelect}
      onCancel={() => confirmSyncChanges(false)}
    />,
    document.body
  );
}
