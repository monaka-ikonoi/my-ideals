import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTemplateFetcher } from '@/hooks/useTemplateFetcher';
import { getActiveProfile, useProfileSessionStore } from '@/stores/profileSessionStore';
import { TemplateUrlInput } from '../TemplateUrlInput';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';

type ProfileEditTemplateUrlDialogProps = {
  onClose: () => void;
  profileId: string;
  templateId: string;
  currentUrl: string;
};

export function ProfileEditTemplateUrlDialog({
  onClose,
  profileId,
  templateId,
  currentUrl,
}: ProfileEditTemplateUrlDialogProps) {
  const { t } = useTranslation();
  const { url, setUrl, state } = useTemplateFetcher({
    initialUrl: currentUrl,
    expectedId: templateId,
  });

  const [allowIdMismatch, setAllowIdMismatch] = useState(false);

  const handleSave = async () => {
    const trimmedUrl = url.trim();

    if (trimmedUrl === currentUrl) {
      onClose();
      return;
    }
    try {
      if (state.status === 'success') {
        getActiveProfile().updateTemplateInfo(trimmedUrl);
        await useProfileSessionStore.getState().load(profileId); // Trigger reload
      } else if (allowIdMismatch && state.status === 'id-mismatch') {
        getActiveProfile().updateTemplateInfo(trimmedUrl, state.actualId);
        await useProfileSessionStore.getState().load(profileId); // Trigger reload
      } else {
        return;
      }
      toast.success(t('toast.profile-template url-updated'));
      onClose();
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  };

  return (
    <ConfirmDialog
      isOpen={true}
      title={t('dialog.profile-edit-template-url.title')}
      options={[
        {
          label: t('common.save'),
          value: 'save',
          variant: state.status === 'id-mismatch' ? 'danger' : 'primary',
          disabled:
            state.status !== 'success' && !(allowIdMismatch && state.status === 'id-mismatch'),
        },
      ]}
      onSelect={handleSave}
      onCancel={onClose}
    >
      <div className="space-y-4">
        <TemplateUrlInput
          url={url}
          onUrlChange={setUrl}
          state={state}
          templateId={templateId}
          allowIdMismatch={allowIdMismatch}
          autoFocus
        />

        {/* Error */}
        {state.status === 'error' && (
          <div className="rounded-lg bg-red-50 p-3">
            <pre className="text-sm whitespace-pre-wrap text-red-600">{state.message}</pre>
          </div>
        )}

        {state.status === 'id-mismatch' && (
          <label
            className="flex cursor-pointer items-center gap-2 text-sm text-gray-500 select-none"
          >
            <input
              type="checkbox"
              checked={allowIdMismatch}
              onChange={e => setAllowIdMismatch(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-red-600 focus:ring-red-500"
            />
            {t('dialog.profile-edit-template-url.allow-id-mismatch')}
          </label>
        )}
      </div>
    </ConfirmDialog>
  );
}
