import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfileListStore } from '@/stores/profileListStore';
import { useTemplateFetcher } from '@/hooks/useTemplateFetcher';
import { usePredefinedTemplates } from '@/hooks/usePredefinedTemplates';
import { ProfileFlags, type ProfileFlag } from '@/domain/profile';
import { TemplateUrlInput } from '../TemplateUrlInput';
import { CommonBackdrop } from '../ui/CommonBackdrop';
import { DropdownSelect } from '../ui/DropdownSelect';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';
import { XMarkIcon, UsersIcon, LinkIcon, ListBulletIcon } from '@heroicons/react/24/outline';

type ProfileCreateDialogProps = {
  onClose: () => void;
};

export function ProfileCreateDialog({ onClose }: ProfileCreateDialogProps) {
  const { t } = useTranslation();

  const [profileName, setProfileName] = useState('');
  const [enableCount, setEnableCount] = useState(false);

  const createProfile = useProfileListStore(state => state.createProfile);
  const predefinedTemplates = usePredefinedTemplates();
  const predefinedTemplateOptions = useMemo(
    () =>
      predefinedTemplates.map((t, i) => ({
        label: t.name,
        value: t.link ?? `_placeholder_${i}`,
        disabled: !t.link,
      })),
    [predefinedTemplates]
  );

  const {
    url,
    setUrl,
    state: fetchState,
    template,
  } = useTemplateFetcher({
    onSuccess: template => {
      setProfileName(template.name);
    },
  });

  const handleCreate = async () => {
    const name = profileName.trim();
    if (fetchState.status !== 'success' || !name || !template) return;

    const flags: ProfileFlag[] = [];
    if (enableCount) flags.push(ProfileFlags.ENABLE_COUNT);

    try {
      await createProfile(
        name,
        { id: template.id, link: url.trim(), revision: template.revision },
        flags
      );
      toast.success(t('toast.profile-created', { name }));
      onClose();
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  };

  const canCreate = fetchState.status === 'success' && profileName.trim();

  return (
    <CommonBackdrop>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onMouseDown={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="flex w-full max-w-lg flex-col rounded-lg bg-white text-left shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dialog.profile-create.title')}
            </h2>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 px-4 py-4">
            <TemplateUrlInput url={url} onUrlChange={setUrl} state={fetchState} autoFocus />

            {predefinedTemplateOptions.length > 0 && (
              <DropdownSelect
                icon={<ListBulletIcon className="h-4 w-4" />}
                options={predefinedTemplateOptions}
                value={url}
                onChange={setUrl}
                placeholder={t('dialog.profile-create.predefined-selector-placeholder')}
              />
            )}

            {/* Fetch Error */}
            {fetchState.status === 'error' && (
              <div className="rounded-lg bg-red-50 p-3">
                <pre className="text-sm whitespace-pre-wrap text-red-600">{fetchState.message}</pre>
              </div>
            )}

            {/* Success: Template Info + Name */}
            {fetchState.status === 'success' && template && (
              <>
                <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                  <div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      <div className="mt-0.5 font-mono text-xs text-gray-500">
                        ID: {template.id} (rev. {template.revision})
                      </div>
                    </div>
                    {template.description && (
                      <div className="mt-1 text-sm whitespace-pre-line text-gray-500">
                        {template.description}
                      </div>
                    )}
                    {template.author && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <UsersIcon className="h-4 w-4" />
                        {template.author}
                      </div>
                    )}
                    {template.link && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <LinkIcon className="h-4 w-4" />
                        <a
                          href={template.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate underline hover:text-gray-600"
                        >
                          {template.link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('dialog.profile-create.profile-name')}
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2
                      text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                      focus:outline-none sm:text-sm"
                  />
                </div>
                <label
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200
                    p-3 transition-colors hover:bg-gray-50 has-[:checked]:border-blue-200
                    has-[:checked]:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    checked={enableCount}
                    onChange={e => setEnableCount(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-600
                      focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {t('dialog.profile-create.enable-count.label')}
                    </span>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t('dialog.profile-create.enable-count.description')}
                    </p>
                  </div>
                </label>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.create')}
            </button>
          </div>
        </div>
      </div>
    </CommonBackdrop>
  );
}
