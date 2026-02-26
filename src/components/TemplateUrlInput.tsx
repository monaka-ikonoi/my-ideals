import { useTranslation } from 'react-i18next';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { TemplateFetchState } from '@/hooks/useTemplateFetcher';

type TemplateUrlInputProps = {
  url: string;
  onUrlChange: (url: string) => void;
  state: TemplateFetchState;
  templateId?: string;
  autoFocus?: boolean;
};

function getBorderClass(status: TemplateFetchState['status']): string {
  switch (status) {
    case 'invalid-url':
    case 'id-mismatch':
    case 'error':
      return 'border-red-300 focus:border-red-500 focus:ring-red-500';
    case 'success':
      return 'border-green-300 focus:border-green-500 focus:ring-green-500';
    case 'idle':
    case 'loading':
    default:
      return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  }
}

export function TemplateUrlInput({
  url,
  onUrlChange,
  state,
  templateId = '',
  autoFocus = false,
}: TemplateUrlInputProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {t('input.template-url.label')}
      </label>
      <div className="relative mt-1">
        <input
          type="url"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          placeholder={t('input.template-url.placeholder')}
          className={`w-full rounded-lg border px-3 py-2 pr-10 text-base focus:ring-1
            focus:outline-none sm:text-sm ${getBorderClass(state.status)}`}
          autoFocus={autoFocus}
        />
        {/* Status Icon */}
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          {state.status === 'loading' && (
            <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
          )}
          {state.status === 'success' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
          {(state.status === 'error' || state.status === 'id-mismatch') && (
            <XCircleIcon className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Error Messages */}
      {state.status === 'invalid-url' && (
        <p className="mt-1 text-xs text-red-500">{t('input.template-url.invalid-url')}</p>
      )}
      {state.status === 'id-mismatch' && (
        <p className="mt-1 text-xs text-red-500">
          {t('input.template-url.id-mismatch', {
            expected: templateId,
            actual: state.actualId,
          })}
        </p>
      )}
    </div>
  );
}
