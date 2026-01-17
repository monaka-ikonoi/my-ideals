import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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

type ImportState =
  | { status: 'idle' }
  | { status: 'loading'; fileName: string }
  | { status: 'success'; fileName: string; profile: Profile; isConflict: boolean }
  | { status: 'error'; fileName: string; message: string };

type ProfileImportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const FileSelectorBoarderStyles = {
  idle: 'border-gray-300 hover:border-blue-400 hover:bg-blue-50',
  loading: 'border-blue-300',
  success: 'border-green-300',
  error: 'border-red-300',
};

export function ProfileImportDialog({ isOpen, onClose }: ProfileImportDialogProps) {
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  const profiles = useProfileListStore(s => s.profiles);
  const activeProfileId = useProfileListStore(s => s.activeId);
  const importProfile = useProfileListStore(s => s.importProfile);

  const handleClose = () => {
    setState({ status: 'idle' });
    onClose();
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
      const isConflict = profiles.some(p => p.id === profile.id);

      setState({ status: 'success', fileName, profile, isConflict });
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

  const handleImport = (overwrite: boolean) => {
    if (state.status !== 'success') return;

    importProfile(state.profile, overwrite);

    if (overwrite && state.profile.id === activeProfileId) {
      useActiveProfileStore.getState().load(activeProfileId);
    }

    handleClose();
  };

  if (!isOpen) return null;

  const collectionsCount =
    state.status === 'success' ? Object.keys(state.profile.collections).length : 0;
  const itemsCount =
    state.status === 'success'
      ? Object.values(state.profile.collections).reduce(
          (sum, items) => sum + Object.keys(items).length,
          0
        )
      : 0;
  const checkedCount =
    state.status === 'success'
      ? Object.values(state.profile.collections).reduce(
          (sum, items) => sum + Object.values(items).filter(Boolean).length,
          0
        )
      : 0;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/50" />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
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
                {state.isConflict && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                    <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-500" />
                    <div className="text-sm text-amber-800">
                      {t('dialog.profile-import.conflict-message')}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium text-gray-900">{state.profile.name}</div>
                      <div className="mt-0.5 font-mono text-xs text-gray-500">
                        ID: {state.profile.id}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>
                        {t('dialog.profile-import.collections-count', { count: collectionsCount })}
                      </span>
                      <span>
                        {t('dialog.profile-import.stats', {
                          count: checkedCount,
                          total: itemsCount,
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      {t('common.template')}: {state.profile.template.id} (rev.{' '}
                      {state.profile.template.revision})
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
              (state.isConflict ? (
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
                  onClick={() => handleImport(false)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                    hover:bg-blue-700"
                >
                  {t('common.import')}
                </button>
              ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
