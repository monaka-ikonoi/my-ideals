import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PencilIcon,
  LinkIcon,
  ClipboardDocumentCheckIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { InlineCode } from './ui/InlineCode';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { useDialogStore } from '@/stores/dialogStore';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import { toast } from 'sonner';

export function ProfileInfo() {
  const { t } = useTranslation();

  const profile = useActiveProfileStore(state => state.profile!);
  const template = useActiveProfileStore(state => state.template!);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profile.template.link);
    toast.success(t('toast.template-link-copied'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {/* Profile Name */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{profile.name}</h1>
          <button
            onClick={() => useDialogStore.getState().openRenameProfile(profile.id, profile.name)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('profile.rename')}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ID */}
        <div className="text-sm text-gray-500">
          <InlineCode>ID: {profile.id}</InlineCode>
        </div>
      </div>

      <div
        className="flex flex-col gap-2 text-sm text-gray-500 md:flex-row md:items-center md:gap-4"
      >
        {/* Template */}
        <div className="flex items-center gap-1">
          <div className="flex-1 sm:flex-initial">
            <span className="block sm:inline">
              {t('common.template')}: {template.name}
            </span>
            <span className="hidden sm:mx-2 sm:inline">/</span>
            <span className="block font-mono text-gray-500 sm:inline">
              {profile.template.id} (rev. {profile.template.revision})
            </span>
          </div>
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
          <button
            onClick={() =>
              useDialogStore
                .getState()
                .openEditProfileTemplateUrl(profile.id, template.id, profile.template.link)
            }
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('profile.edit-template-url')}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>

        <span className="hidden h-4 w-px bg-gray-300 md:block" aria-hidden="true" />

        {/* Mode */}
        <div className="flex items-center gap-1">
          <div className="flex-1 sm:flex-initial">
            {t('profile.mode.label')}:{' '}
            {profileHasFlag(profile, ProfileFlags.ENABLE_COUNT)
              ? t('profile.mode.count')
              : t('profile.mode.standard')}
          </div>
          <button
            onClick={() =>
              useDialogStore
                .getState()
                .openSwitchProfileMode(
                  profile.id,
                  !profileHasFlag(profile, ProfileFlags.ENABLE_COUNT)
                )
            }
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('profile.mode.switch')}
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
