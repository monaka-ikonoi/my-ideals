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
  const { t, i18n } = useTranslation();

  const { id: templateId, name: templateName } = useTemplate();
  const { profileId, profileName, mode, lastModified, profileTemplateInfo } = useActiveProfile(
    useShallow(state => ({
      profileId: state.profile.id,
      profileName: state.profile.name,
      profileTemplateInfo: state.profile.template,
      mode: state.profile.mode,
      lastModified: state.profile.lastModified,
    }))
  );

  const [copied, setCopied] = useState(false);

  const lastModifiedText =
    lastModified === 0 ? t('common.unknown') : new Date(lastModified).toLocaleString(i18n.language);

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
    <div
      className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_auto]
        md:grid-rows-[auto_1fr]"
    >
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

      {/* ID and last modified time */}
      <div
        className="flex flex-col items-start gap-2 text-sm text-gray-500 md:col-start-2
          md:row-span-2 md:row-start-1 md:items-end"
      >
        <InlineCode>ID: {profileId}</InlineCode>
        <span className="self-stretch text-left text-xs md:text-right">
          {t('profile.last-modified')}: {lastModifiedText}
        </span>
      </div>

      <div
        className="flex flex-col gap-x-8 gap-y-2 overflow-x-clip text-sm text-gray-500 md:flex-row
          md:flex-wrap md:items-center"
      >
        {/* Template */}
        <div className="flex items-center gap-1">
          <div className="flex-1 md:flex-initial">
            <span className="block sm:inline">
              {t('common.template')}: {templateName}
            </span>
            <span className="hidden sm:mx-2 sm:inline">/</span>
            <span className="block font-mono sm:inline">
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

        {/* Mode */}
        <div className="relative flex items-center gap-1">
          <span className="absolute top-1/2 -left-4 h-4 w-px -translate-y-1/2 bg-gray-300" />
          <div className="flex-1 md:flex-initial">
            {t('profile.mode.label')}: {t(ModeLabelKeys[mode])}
          </div>
          <button
            onClick={() => useDialogStore.getState().openEditProfileMode()}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('dialog.profile-mode.title')}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
