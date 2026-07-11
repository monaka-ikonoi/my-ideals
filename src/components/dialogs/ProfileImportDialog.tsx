import { useState, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
import { ZodError } from 'zod';
import {
  ArrowPathIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { ProfileSchema, type Profile } from '@/domain/profile';
import { useProfileListStore } from '@/stores/profileListStore';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { CommonBackdrop } from '../ui/CommonBackdrop';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';
import { getProfileStorage } from '@/storage/ProfileStorage';

type ConflictState = { hasConflict: false } | { hasConflict: true; existingLastModified: number };

type PendingProfileState = {
  profile: Readonly<Profile>;
  conflict: ConflictState;
  selected: boolean;
  overwrite: boolean;
};

type ImportState =
  | { status: 'idle' }
  | { status: 'loading'; fileName: string }
  | { status: 'success'; fileName: string; pending: PendingProfileState[] }
  | { status: 'error'; fileName: string; message: string };

const FileSelectorBoarderStyles = {
  idle: 'border-gray-300 hover:border-blue-400 hover:bg-blue-50',
  loading: 'border-blue-300',
  success: 'border-green-300',
  error: 'border-red-300',
};

type ProfileImportDialogProps = {
  onClose: () => void;
};

export function ProfileImportDialog({ onClose }: ProfileImportDialogProps) {
  const { t, i18n } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  const { profiles, activeProfileId, importProfile, setActiveProfile } = useProfileListStore(
    useShallow(state => ({
      profiles: state.profiles,
      activeProfileId: state.activeId,
      importProfile: state.importProfile,
      setActiveProfile: state.setActiveProfile,
    }))
  );

  const handleClose = () => {
    setState({ status: 'idle' });
    onClose();
  };

  const buildConflictState = async (profileId: string): Promise<ConflictState> => {
    if (!profiles.some(p => p.id === profileId)) return { hasConflict: false };
    const existingLastModified =
      profileId === activeProfileId
        ? (useActiveProfileStore.getState().profile?.lastModified ?? 0)
        : ((await getProfileStorage().getProfile(profileId))?.lastModified ?? 0);
    return { hasConflict: true, existingLastModified };
  };

  const buildPendingState = async (profile: Profile): Promise<PendingProfileState> => {
    const conflict = await buildConflictState(profile.id);
    return { profile, conflict, selected: true, overwrite: !conflict.hasConflict };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const fileName = file.name;
    setState({ status: 'loading', fileName });

    try {
      const text = await file.text();
      const profile = ProfileSchema.parse(JSON.parse(text));
      const pendingState = await buildPendingState(profile);

      setState({
        status: 'success',
        fileName,
        pending: [pendingState],
      });
    } catch (e) {
      let message = 'Unknown error';
      if (e instanceof SyntaxError) {
        message = `Invalid JSON: ${e.message}`;
      } else if (e instanceof ZodError) {
        message = e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
      } else if (e instanceof Error) {
        message = e.message;
      }
      setState({ status: 'error', fileName, message });
    }
  };

  const commitImport = async (pending: PendingProfileState[]) => {
    const imported: string[] = [];
    for (const p of pending) {
      if (!p.selected) continue;
      imported.push(await importProfile(p.profile, p.overwrite));
    }
    return imported;
  };

  const handleImportSingle = async (overwrite: boolean) => {
    if (state.status !== 'success') return;

    const pending = [...state.pending];
    if (pending.length !== 1 || !pending[0].selected) return;

    pending[0].overwrite = overwrite;

    try {
      const importedIds = await commitImport(pending);
      setActiveProfile(importedIds[0]);

      // reload on overwrite
      if (importedIds[0] === activeProfileId) {
        await useActiveProfileStore.getState().load(activeProfileId);
      }
      toast.success(t('toast.profile-imported', { name: pending[0].profile.name }));
      handleClose();
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  };

  const formatTimestampString = (timestamp: number) =>
    timestamp === 0 ? t('common.unknown') : new Date(timestamp).toLocaleString(i18n.language);

  const compareTimestamps = (t1: number, t2: number) => {
    if (t1 === 0 || t2 === 0) return null;
    if (t1 === t2) return null;
    return t1 > t2;
  };

  return (
    <CommonBackdrop>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onMouseDown={e => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          className="w-full max-w-lg rounded-lg bg-white text-left shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dialog.profile-import.title')}
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 px-4 py-4">
            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File Select Area */}
            {state.status === 'idle' ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg
                  border-2 border-dashed border-gray-300 p-8 text-gray-500 hover:border-blue-400
                  hover:bg-blue-50 hover:text-blue-600"
              >
                <DocumentArrowUpIcon className="h-10 w-10" />
                <span className="text-sm font-medium">
                  {t('dialog.profile-import.select-file')}
                </span>
                <span className="text-xs text-gray-400">
                  {t('dialog.profile-import.select-file-hint')}
                </span>
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={state.status === 'loading'}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left
                  disabled:cursor-wait ${FileSelectorBoarderStyles[state.status]}`}
              >
                <DocumentArrowUpIcon className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                  {state.fileName}
                </span>
                {/* Status Icon */}
                <div className="shrink-0">
                  {state.status === 'loading' && (
                    <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {state.status === 'success' && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  )}
                  {state.status === 'error' && <XCircleIcon className="h-4 w-4 text-red-500" />}
                </div>
              </button>
            )}

            {/* Error */}
            {state.status === 'error' && (
              <div className="rounded-lg bg-red-50 p-3">
                <pre className="text-sm whitespace-pre-wrap text-red-600">{state.message}</pre>
              </div>
            )}

            {/* Success */}
            {state.status === 'success' && (
              <>
                {state.pending[0].conflict.hasConflict && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                    <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-500" />
                    <div className="text-sm text-amber-800">
                      {t('dialog.profile-import.conflict-message')}
                      <div className="mt-1 space-y-0.5 text-xs text-amber-700">
                        <div className="flex gap-2">
                          <span className="w-16 shrink-0 font-medium">
                            {t('dialog.profile-import.existing')}:{' '}
                          </span>
                          <span>
                            {formatTimestampString(state.pending[0].conflict.existingLastModified)}
                          </span>
                          {compareTimestamps(
                            state.pending[0].conflict.existingLastModified,
                            state.pending[0].profile.lastModified
                          ) && <span>{t('dialog.profile-import.newer')}</span>}
                        </div>
                        <div className="flex gap-2">
                          <span className="w-16 shrink-0 font-medium">
                            {t('dialog.profile-import.importing')}:{' '}
                          </span>
                          <span>
                            {formatTimestampString(state.pending[0].profile.lastModified)}
                          </span>
                          {compareTimestamps(
                            state.pending[0].profile.lastModified,
                            state.pending[0].conflict.existingLastModified
                          ) && <span>{t('dialog.profile-import.newer')}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {state.pending[0].profile.name}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-gray-500">
                        ID: {state.pending[0].profile.id}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
            <button
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t('common.cancel')}
            </button>

            {state.status === 'success' &&
              (state.pending[0].conflict.hasConflict ? (
                <>
                  <button
                    onClick={() => handleImportSingle(true)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white
                      hover:bg-red-700"
                  >
                    {t('common.overwrite')}
                  </button>
                  <button
                    onClick={() => handleImportSingle(false)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                      hover:bg-blue-700"
                  >
                    {t('common.create-copy')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleImportSingle(false)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                    hover:bg-blue-700"
                >
                  {t('common.import')}
                </button>
              ))}
          </div>
        </div>
      </div>
    </CommonBackdrop>
  );
}
