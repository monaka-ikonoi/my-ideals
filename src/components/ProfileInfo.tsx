import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PencilIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { InlineCode } from './ui/InlineCode';
import { ConfirmDialog } from './ui/ConfirmDialog';
import type { WorkingProfile } from '@/domain/working';

type ProfileInfoProps = {
  working: WorkingProfile;
  renameFn: (name: string) => void;
};

export function ProfileInfo({ working, renameFn }: ProfileInfoProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(working?.profile.template.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditName = () => {
    setNewName(working.profile.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (newName.trim()) {
      renameFn(newName.trim());
      setIsEditingName(false);
    }
  };

  if (working)
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {/* Profile Name */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{working.profile.name}</h1>
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
            <InlineCode>ID: {working.profile.id}</InlineCode>
          </div>
        </div>

        {/* Template */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>
            Template: {working.template.name} /{' '}
            <span className="font-mono">{working.template.id}</span>
          </span>
          <button
            onClick={handleCopyLink}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Copy template link"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ClipboardIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Rename Dialog */}
        {createPortal(
          <ConfirmDialog
            isOpen={isEditingName}
            title="Edit Profile Name"
            message={
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base
                  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
            }
            options={[{ label: 'Save', value: 'save', variant: 'primary' }]}
            onSelect={handleSaveName}
            onCancel={() => setIsEditingName(false)}
          />,
          document.body
        )}
      </div>
    );
}
