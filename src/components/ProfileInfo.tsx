import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PencilIcon, LinkIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { InlineCode } from './ui/InlineCode';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { useProfileListStore } from '@/stores/profileListStore';

export function ProfileInfo() {
  const { t } = useTranslation();

  const profile = useActiveProfileStore(state => state.profile!);
  const template = useActiveProfileStore(state => state.template!);

  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profile.template.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditName = () => {
    setNewName(profile.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const name = newName.trim();
    if (name) {
      useActiveProfileStore.getState().updateName(name);
      useProfileListStore.getState().renameProfile(profile.id, name);
      setIsEditingName(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {/* Profile Name */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{profile.name}</h1>
          <button
            onClick={handleEditName}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Edit name"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ID */}
        <div className="text-sm text-gray-500">
          <InlineCode>ID: {profile.id}</InlineCode>
        </div>
      </div>

      {/* Template */}
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <span>
          {t('common.template')}: {template.name} / <span className="font-mono">{template.id}</span>
        </span>
        <button
          onClick={handleCopyLink}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title={t('profile.copy-template-link')}
        >
          {copied ? (
            <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-500" />
          ) : (
            <LinkIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Rename Dialog */}
      <ConfirmDialog
        isOpen={isEditingName}
        title="Edit Profile Name"
        message={
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveName();
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
        }
        options={[{ label: t('common.save'), value: 'save', variant: 'primary' }]}
        onSelect={handleSaveName}
        onCancel={() => setIsEditingName(false)}
      />
    </div>
  );
}
