import { useRef } from 'react';
import { useImmer } from 'use-immer';
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
import { ProfileSchema, ProfileBundleSchema, type Profile } from '@/domain/profile';
import { useProfileListStore } from '@/stores/profileListStore';
import { getSessionProfile, useProfileSessionStore } from '@/stores/profileSessionStore';
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
  | {
      status: 'success';
      fileName: string;
      type: 'single' | 'bundle';
      pending: PendingProfileState[];
    }
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
  const [state, setState] = useImmer<ImportState>({ status: 'idle' });

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
        ? (getSessionProfile()?.lastModified ?? 0)
        : ((await getProfileStorage().getProfile(profileId))?.lastModified ?? 0);
    return { hasConflict: true, existingLastModified };
  };

  const buildPendingState = async (profile: Profile): Promise<PendingProfileState> => {
    const conflict = await buildConflictState(profile.id);
    return { profile, conflict, selected: true, overwrite: !conflict.hasConflict };
  };

  const setPendingSelected = (index: number, selected: boolean) => {
    setState(draft => {
      if (draft.status !== 'success') return;
      draft.pending[index].selected = selected;
    });
  };

  const setPendingOverwrite = (index: number, overwrite: boolean) => {
    setState(draft => {
      if (draft.status !== 'success') return;
      draft.pending[index].overwrite = overwrite;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const fileName = file.name;
    setState({ status: 'loading', fileName });

    try {
      const parsed = JSON.parse(await file.text());
      const type = parsed?.magic === 'my-ideals-profile-bundle' ? 'bundle' : 'single';
      const parsedProfiles =
        parsed?.magic === 'my-ideals-profile-bundle'
          ? ProfileBundleSchema.parse(parsed).profiles
          : [ProfileSchema.parse(parsed)];
      const pending = await Promise.all(parsedProfiles.map(buildPendingState));

      setState({ status: 'success', fileName, type, pending });
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

  const handleImport = async (overwrite?: boolean) => {
    if (state.status !== 'success') return;

    const pending =
      overwrite === undefined ? state.pending : state.pending.map(p => ({ ...p, overwrite }));
    const selected = pending.filter(p => p.selected);
    if (selected.length === 0) return;

    try {
      const importedIds: string[] = [];
      for (const p of selected) {
        importedIds.push(await importProfile(p.profile, p.overwrite));
      }

      // reload on overwrite
      if (activeProfileId && importedIds.some(id => id === activeProfileId)) {
        await useProfileSessionStore.getState().load(activeProfileId);
      } else if (state.type === 'single' || activeProfileId === null) {
        setActiveProfile(importedIds[0]);
      }

      if (state.type === 'single') {
        toast.success(t('toast.profile-imported', { name: selected[0].profile.name }));
      } else {
        toast.success(t('toast.profiles-imported', { count: selected.length }));
      }
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

  const pendingCount = state.status === 'success' ? state.pending.length : 0;
  const selectedCount =
    state.status === 'success' ? state.pending.filter(p => p.selected).length : 0;
  const conflictCount =
    state.status === 'success' ? state.pending.filter(p => p.conflict.hasConflict).length : 0;
  const conflictSelectedCount =
    state.status === 'success'
      ? state.pending.filter(p => p.selected && p.conflict.hasConflict).length
      : 0;

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
                className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left
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
              <div className="space-y-2">
                <div className="px-2.5">
                  <div className="text-sm font-medium text-gray-700">
                    {t('dialog.profile-import.count-message', {
                      count: selectedCount,
                      total: pendingCount,
                    })}
                  </div>
                  {state.type === 'bundle' && (
                    <div className="text-xs text-gray-500">
                      {t('dialog.profile-import.bundle-hint')}
                    </div>
                  )}
                  {conflictCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-800">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {t('dialog.profile-import.conflict-message', {
                        count: conflictSelectedCount,
                        total: conflictCount,
                      })}
                    </div>
                  )}
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {state.pending.map((p, i) => (
                    <div
                      key={p.profile.id}
                      onClick={() => {
                        if (state.type === 'single') return;
                        setPendingSelected(i, !p.selected);
                      }}
                      className={`rounded-lg border p-2.5 ${
                        state.type === 'bundle' ? 'cursor-pointer' : ''
                      } ${
                        p.selected
                          ? p.conflict.hasConflict
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={p.selected}
                          disabled={state.type === 'single'}
                          readOnly
                          className="h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-600
                            focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-sm font-medium text-gray-900">
                              {p.profile.name}
                            </span>
                          </div>
                          <div className="truncate font-mono text-xs text-gray-500">
                            ID: {p.profile.id}
                          </div>
                        </div>

                        {p.conflict.hasConflict && (
                          <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
                        )}
                      </div>

                      {p.conflict.hasConflict && (
                        <div
                          className="mt-1.5 flex flex-wrap items-start justify-between gap-2 pl-6"
                        >
                          <div className="space-y-0.5 text-xs text-amber-700">
                            <div className="flex gap-2">
                              <span className="w-16 shrink-0 font-medium">
                                {t('dialog.profile-import.existing')}:{' '}
                              </span>
                              <span>{formatTimestampString(p.conflict.existingLastModified)}</span>
                              {compareTimestamps(
                                p.conflict.existingLastModified,
                                p.profile.lastModified
                              ) && <span>{t('dialog.profile-import.newer')}</span>}
                            </div>
                            <div className="flex gap-2">
                              <span className="w-16 shrink-0 font-medium">
                                {t('dialog.profile-import.importing')}:{' '}
                              </span>
                              <span>{formatTimestampString(p.profile.lastModified)}</span>
                              {compareTimestamps(
                                p.profile.lastModified,
                                p.conflict.existingLastModified
                              ) && <span>{t('dialog.profile-import.newer')}</span>}
                            </div>
                          </div>

                          {state.type === 'bundle' && (
                            <div
                              className="inline-flex shrink-0 overflow-hidden rounded-md border
                                border-gray-300"
                            >
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setPendingOverwrite(i, true);
                                }}
                                disabled={!p.selected}
                                className={`px-3 py-1 text-xs font-medium
                                disabled:cursor-not-allowed disabled:opacity-40 ${
                                  p.overwrite
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {t('common.overwrite')}
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setPendingOverwrite(i, false);
                                }}
                                disabled={!p.selected}
                                className={`border-l border-gray-300 px-3 py-1 text-xs font-medium
                                disabled:cursor-not-allowed disabled:opacity-40 ${
                                  !p.overwrite
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {t('common.create-copy')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
              (state.type === 'single' ? (
                state.pending[0].conflict.hasConflict ? (
                  <>
                    <button
                      onClick={() => handleImport(true)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white
                        hover:bg-red-700"
                    >
                      {t('common.overwrite')}
                    </button>
                    <button
                      onClick={() => handleImport(false)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                        hover:bg-blue-700"
                    >
                      {t('common.create-copy')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleImport()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                      hover:bg-blue-700"
                  >
                    {t('common.import')}
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleImport()}
                  disabled={selectedCount === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                    hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
