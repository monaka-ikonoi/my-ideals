import { useTranslation } from 'react-i18next';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { useProfileListStore } from '@/stores/profileListStore';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { useDialogStore } from '@/stores/dialogStore';
import { ProfileExportButton } from './ProfileExportButton';
import { ArrowPathIcon, ArrowDownTrayIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useShallow } from 'zustand/shallow';

export function ProfileErrorPage() {
  const { t } = useTranslation();

  const profileId = useProfileListStore(state => state.activeId!);
  const { error, hasProfile, loadProfile, templateInfo } = useActiveProfileStore(
    useShallow(state => ({
      error: state.error!,
      hasProfile: !!state.profile,
      loadProfile: state.load,
      templateInfo: state.profile?.template,
    }))
  );

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 px-4 text-center">
        {/* Icon */}
        <div className="rounded-full bg-red-100 p-3">
          <XCircleIcon className="h-10 w-10 text-red-600" />
        </div>

        {/* Title */}
        <div className="text-lg font-semibold text-gray-900">{t('common.error-title')}</div>

        {/* Error message box */}
        <div className="w-full max-w-lg rounded-lg border border-red-200 bg-red-50 p-4">
          <pre className="text-left font-mono text-sm break-words whitespace-pre-wrap text-red-700">
            {error.message}
          </pre>
        </div>

        {/* Actions */}
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => loadProfile(profileId)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2
              text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {t('common.try-again')}
          </button>
          {error.type === 'template' && hasProfile && (
            <>
              <ProfileExportButton
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4
                  py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {t('profile.save-backup')}
              </ProfileExportButton>
              <button
                onClick={() =>
                  useDialogStore
                    .getState()
                    .openEditProfileTemplateUrl(profileId, templateInfo!.id, templateInfo!.link)
                }
                className="flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600
                  px-4 py-2 text-sm font-medium text-white hover:border-blue-600 hover:bg-blue-700"
              >
                <PencilIcon className="h-4 w-4" />
                {t('profile.edit-template-url')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
