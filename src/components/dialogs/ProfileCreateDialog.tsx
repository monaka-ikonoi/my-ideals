import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordModes, type RecordMode } from '@/domain/profile';
import { useProfileListStore } from '@/stores/profileListStore';
import { useTemplateFetcher } from '@/hooks/useTemplateFetcher';
import { usePredefinedTemplates } from '@/hooks/usePredefinedTemplates';
import { TemplateUrlInput } from '../TemplateUrlInput';
import { DropdownSelect } from '../ui/DropdownSelect';
import { FullScreenModal } from '../ui/FullScreenModal';
import {
  buildRecordFieldDrafts,
  parseRecordFieldDrafts,
  validateRecordFieldDrafts,
} from './RecordFieldDrafts';
import { RecordFieldsEditor } from './RecordFieldsEditor';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';
import { ArrowLeftIcon, UsersIcon, LinkIcon, ListBulletIcon } from '@heroicons/react/24/outline';

type ProfileCreateDialogProps = {
  onClose: () => void;
};

export function ProfileCreateDialog({ onClose }: ProfileCreateDialogProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<'common' | 'fields'>('common');
  const [profileName, setProfileName] = useState('');
  const [mode, setMode] = useState<RecordMode>('standard');
  const [drafts, setDrafts] = useState(() => buildRecordFieldDrafts());

  const createProfile = useProfileListStore(state => state.createProfile);
  const { configured, loading, templates } = usePredefinedTemplates();
  const predefinedTemplateOptions = useMemo(
    () =>
      templates.map((t, i) => ({
        label: t.name,
        value: t.link ?? `_placeholder_${i}`,
        disabled: !t.link,
      })),
    [templates]
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

  const canCreate = fetchState.status === 'success' && !!profileName.trim();
  const canCreateCustom = canCreate && mode === 'custom' && validateRecordFieldDrafts(drafts);

  const handleCreate = async () => {
    const name = profileName.trim();
    if (!canCreate || !template) return;

    try {
      await createProfile(
        name,
        { id: template.id, link: url.trim(), revision: template.revision },
        mode,
        mode === 'custom' ? parseRecordFieldDrafts(drafts) : undefined
      );
      toast.success(t('toast.profile-created', { name }));
      onClose();
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  };

  const handleSubmit = () => {
    if (mode === 'custom' && step === 'common') setStep('fields');
    else void handleCreate();
  };

  return (
    <FullScreenModal isOpen title={t('dialog.profile-create.title')} onClose={onClose}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:px-6">
          {step === 'common' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <TemplateUrlInput url={url} onUrlChange={setUrl} state={fetchState} autoFocus />
                {configured && (
                  <DropdownSelect
                    icon={<ListBulletIcon className="h-4 w-4" />}
                    options={predefinedTemplateOptions}
                    value={url}
                    onChange={setUrl}
                    disabled={loading}
                    placeholder={
                      loading
                        ? t('common.loading')
                        : t('dialog.profile-create.predefined-selector-placeholder')
                    }
                  />
                )}
              </div>

              {/* Fetch Error */}
              {fetchState.status === 'error' && (
                <div className="rounded-lg bg-red-50 p-3">
                  <pre className="text-sm whitespace-pre-wrap text-red-600">
                    {fetchState.message}
                  </pre>
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
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2
                        text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                        focus:outline-none sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('dialog.profile-create.mode-label')}
                    </label>
                    {RecordModes.map(value => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border
                          border-gray-200 p-3 transition-colors hover:bg-gray-50
                          has-[:checked]:border-blue-200 has-[:checked]:bg-blue-50"
                      >
                        <input
                          type="radio"
                          name="record-mode"
                          checked={mode === value}
                          onChange={() => setMode(value)}
                          className="mt-0.5 h-4 w-4 shrink-0 border-gray-300 accent-blue-600
                            focus:ring-blue-500"
                        />
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">
                            {t(`profile.mode.${value}`)}
                          </span>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {t(`dialog.profile-create.mode-desc.${value}`)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <RecordFieldsEditor drafts={drafts} onChange={setDrafts} />
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-4 py-3 sm:px-6">
          {step === 'fields' ? (
            <button
              type="button"
              onClick={() => setStep('common')}
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium
                text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {t('common.back')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={step === 'common' ? !canCreate : !canCreateCustom}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
              hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'custom' && step === 'common' ? t('common.next') : t('common.create')}
          </button>
        </div>
      </div>
    </FullScreenModal>
  );
}
