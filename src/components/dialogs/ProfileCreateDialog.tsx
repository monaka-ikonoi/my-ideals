import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash-es';
import { z, ZodError } from 'zod';
import {
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { TemplateSchema, type Template } from '@/domain/template';
import { type ProfileTemplateInfo } from '@/domain/profile';
import { useProfileListStore } from '@/stores/profileListStore';

type FetchState =
  | { status: 'idle' }
  | { status: 'invalid-url' }
  | { status: 'loading' }
  | { status: 'success'; template: Template }
  | { status: 'error'; message: string };

type ProfileCreateDialogProps = {
  onClose: () => void;
};

export function ProfileCreateDialog({ onClose }: ProfileCreateDialogProps) {
  const { t } = useTranslation();

  const [templateUrl, setTemplateUrl] = useState('');
  const [profileName, setProfileName] = useState('');
  const [templateInfo, setTemplateInfo] = useState<ProfileTemplateInfo | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' });

  const abortControllerRef = useRef<AbortController | null>(null);
  const createProfile = useProfileListStore(state => state.createProfile);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchTemplate = useCallback(
    async (url: string, signal: AbortSignal) => {
      setFetchState({ status: 'loading' });

      try {
        const response = await fetch(url, { signal });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const template = TemplateSchema.parse(data);

        setFetchState({ status: 'success', template });
        setProfileName(template.name);
        setTemplateInfo({ id: template.id, link: templateUrl.trim(), revision: template.revision });
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;

        let message = 'Failed to fetch template';
        if (e instanceof ZodError) {
          message = `Invalid template:\n${e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')}`;
        } else if (e instanceof Error) {
          message = e.message;
        }

        setFetchState({ status: 'error', message });
      }
    },
    [templateUrl]
  );

  const debouncedFetch = useMemo(
    () =>
      debounce((url: string) => {
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        fetchTemplate(url, controller.signal);
      }, 500),
    [fetchTemplate]
  );

  useEffect(() => {
    const trimmed = templateUrl.trim();

    if (!trimmed) {
      setFetchState({ status: 'idle' });
      return;
    }

    const urlResult = z.url().safeParse(trimmed);
    if (!urlResult.success) {
      setFetchState({ status: 'invalid-url' });
      return;
    }

    debouncedFetch(trimmed);

    return () => {
      debouncedFetch.cancel();
      abortControllerRef.current?.abort();
    };
  }, [templateUrl, debouncedFetch]);

  const handleCreate = () => {
    const name = profileName.trim();
    if (fetchState.status !== 'success' || !name || !templateInfo) return;

    createProfile(name, templateInfo);
    onClose();
  };

  const canCreate = fetchState.status === 'success' && profileName.trim();

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="w-full max-w-lg rounded-lg bg-white text-left shadow-xl"
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
            {/* Template URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('dialog.profile-create.template-url')}
              </label>
              <div className="relative mt-1">
                <input
                  type="url"
                  value={templateUrl}
                  onChange={e => setTemplateUrl(e.target.value)}
                  placeholder={t('dialog.profile-create.template-url-placeholder')}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-1
                    focus:outline-none ${
                      fetchState.status === 'invalid-url' || fetchState.status === 'error'
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : fetchState.status === 'success'
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } `}
                  autoFocus
                />
                {/* Status Indicator */}
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  {fetchState.status === 'loading' && (
                    <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {fetchState.status === 'success' && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  )}
                  {fetchState.status === 'error' && (
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>

              {/* Inline hint/error */}
              {fetchState.status === 'invalid-url' && (
                <p className="mt-1 text-xs text-red-500">
                  {t('dialog.profile-create.invalid-url')}
                </p>
              )}
            </div>

            {/* Fetch Error */}
            {fetchState.status === 'error' && (
              <div className="rounded-lg bg-red-50 p-3">
                <pre className="text-sm whitespace-pre-wrap text-red-600">{fetchState.message}</pre>
              </div>
            )}

            {/* Success: Template Info + Name */}
            {fetchState.status === 'success' && (
              <>
                <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {fetchState.template.name}
                    </div>
                    {fetchState.template.description && (
                      <div className="mt-1 text-sm whitespace-pre-line text-gray-500">
                        {fetchState.template.description}
                      </div>
                    )}
                    {fetchState.template.author && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <UsersIcon className="h-4 w-4" />
                        {fetchState.template.author}
                      </div>
                    )}
                    {fetchState.template.link && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <LinkIcon className="h-4 w-4" />
                        <a
                          href={fetchState.template.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate underline hover:text-gray-600"
                        >
                          {fetchState.template.link}
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
                      text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                      focus:outline-none"
                  />
                </div>
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
    </>,
    document.body
  );
}
