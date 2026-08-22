import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PencilIcon,
  LinkIcon,
  ClipboardDocumentCheckIcon,
  AdjustmentsHorizontalIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { InlineCode } from './ui/InlineCode';
import { useActiveProfile } from '@/stores/profileSessionStore';
import { useTemplate } from '@/contexts/template';
import { useDialogStore } from '@/stores/dialogStore';
import { type RecordMode } from '@/domain/profile';
import { toast } from 'sonner';
import { useShallow } from 'zustand/shallow';
import { getErrorMessage } from '@/utils/error';

const ModeLabelKeys = {
  standard: 'profile.mode.standard',
  count: 'profile.mode.count',
  custom: 'profile.mode.custom',
} as const satisfies Record<RecordMode, string>;

export function ProfileInfo() {
  const { t } = useTranslation();

  const { profileId, profileName, mode } = useActiveProfile(
    useShallow(state => ({
      profileId: state.profile.id,
      profileName: state.profile.name,
      mode: state.profile.mode,
    }))
  );
  const { id: templateId, name: templateName } = useTemplate();
  const profileTemplateInfo = useActiveProfile(state => state.profile.template);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileTemplateInfo.link);
      toast.success(t('toast.template-link-copied'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {/* Profile Name */}
        <div className="flex items-center gap-1">
          <h1 className="pr-2 text-xl font-semibold text-gray-900">{profileName}</h1>
          <button
            onClick={() => useDialogStore.getState().openRenameProfile(profileId, profileName)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('profile.rename')}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => useDialogStore.getState().openDuplicateProfile()}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('profile.duplicate')}
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ID */}
        <div className="text-sm text-gray-500">
          <InlineCode>ID: {profileId}</InlineCode>
        </div>
      </div>

      <div
        className="flex flex-col gap-2 text-sm text-gray-500 md:flex-row md:items-center md:gap-4"
      >
        {/* Template */}
        <div className="flex items-center gap-1">
          <div className="flex-1 sm:flex-initial">
            <span className="block sm:inline">
              {t('common.template')}: {templateName}
            </span>
            <span className="hidden sm:mx-2 sm:inline">/</span>
            <span className="block font-mono text-gray-500 sm:inline">
              {profileTemplateInfo.id} (rev. {profileTemplateInfo.revision})
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
                .openEditProfileTemplateUrl(profileId, templateId, profileTemplateInfo.link)
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
            {t('profile.mode.label')}: {t(ModeLabelKeys[mode])}
          </div>
          <button
            onClick={() => useDialogStore.getState().openEditRecordFields()}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('dialog.record-fields.title')}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
