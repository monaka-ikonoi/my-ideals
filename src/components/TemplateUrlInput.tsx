import { useTranslation } from 'react-i18next';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { TemplateFetchState } from '@/hooks/useTemplateFetcher';

type TemplateUrlInputProps = {
  url: string;
  onUrlChange: (url: string) => void;
  state: TemplateFetchState;
  templateId?: string;
  allowIdMismatch?: boolean;
  autoFocus?: boolean;
};

function getBorderClass(status: TemplateFetchState['status'], allowIdMismatch: boolean): string {
  const successClass = 'border-green-300 focus:border-green-500 focus:ring-green-500';
  const errorClass = 'border-red-300 focus:border-red-500 focus:ring-red-500';
  const warningClass = 'border-amber-300 focus:border-amber-500 focus:ring-amber-500';

  switch (status) {
    case 'id-mismatch':
      if (allowIdMismatch) return warningClass;
      return errorClass;
    case 'invalid-url':
    case 'error':
      return errorClass;
    case 'success':
      return successClass;
    case 'idle':
    case 'loading':
    default:
      return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  }
}

function getStatusIcon(status: TemplateFetchState['status'], allowIdMismatch: boolean) {
  const loadingIcon = <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />;
  const successIcon = <CheckCircleIcon className="h-4 w-4 text-green-500" />;
  const errorIcon = <XCircleIcon className="h-4 w-4 text-red-500" />;
  const warningIcon = <ExclamationCircleIcon className="h-4 w-4 text-amber-500" />;

  switch (status) {
    case 'loading':
      return loadingIcon;
    case 'success':
      return successIcon;
    case 'id-mismatch':
      if (allowIdMismatch) return warningIcon;
      return errorIcon;
    case 'invalid-url':
    case 'error':
      return errorIcon;
    default:
      return null;
  }
}

export function TemplateUrlInput({
  url,
  onUrlChange,
  state,
  templateId = '',
  allowIdMismatch = false,
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
            focus:outline-none sm:text-sm ${getBorderClass(state.status, allowIdMismatch)}`}
          autoFocus={autoFocus}
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          {getStatusIcon(state.status, allowIdMismatch)}
        </div>
      </div>

      {/* Error Messages */}
      {state.status === 'invalid-url' && (
        <p className="mt-1 text-xs text-red-500">{t('input.template-url.invalid-url')}</p>
      )}
      {state.status === 'id-mismatch' && (
        <p className={`mt-1 text-xs ${allowIdMismatch ? 'text-amber-600' : 'text-red-500'}`}>
          {t('input.template-url.id-mismatch', {
            expected: templateId,
            actual: state.actualId,
          })}
        </p>
      )}
    </div>
  );
}
