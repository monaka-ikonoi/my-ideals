import { useTranslation } from 'react-i18next';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardIcon,
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
  const successClass = 'border-green-300 focus-within:border-green-500 focus-within:ring-green-500';
  const errorClass = 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500';
  const warningClass = 'border-amber-300 focus-within:border-amber-500 focus-within:ring-amber-500';

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
      return 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500';
  }
}

function getStatusIcon(
  status: TemplateFetchState['status'],
  allowIdMismatch: boolean
): { icon: React.ReactNode; clearInput: boolean } | null {
  const loadingIcon = <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />;
  const successIcon = <CheckCircleIcon className="h-4 w-4 text-green-500" />;
  const errorIcon = <XCircleIcon className="h-4 w-4 text-red-500" />;
  const warningIcon = <ExclamationCircleIcon className="h-4 w-4 text-amber-500" />;

  switch (status) {
    case 'loading':
      return { icon: loadingIcon, clearInput: false };
    case 'success':
      return { icon: successIcon, clearInput: false };
    case 'id-mismatch':
      if (allowIdMismatch) return { icon: warningIcon, clearInput: false };
      return { icon: errorIcon, clearInput: true };
    case 'invalid-url':
    case 'error':
      return { icon: errorIcon, clearInput: true };
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onUrlChange(text);
    } catch {
      // clipboard access denied or not available, do nothing
    }
  };

  const statusIcon = getStatusIcon(state.status, allowIdMismatch);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {t('input.template-url.label')}
      </label>
      <div
        className={`mt-1 flex w-full items-center overflow-hidden rounded-lg border
          focus-within:ring-1 focus-within:outline-none ${getBorderClass( state.status,
          allowIdMismatch )}`}
      >
        <div className="flex flex-1 items-center">
          <input
            type="url"
            value={url}
            onChange={e => onUrlChange(e.target.value)}
            placeholder={t('input.template-url.placeholder')}
            className="min-w-0 flex-1 py-2 pr-2 pl-3 text-base focus:outline-none sm:text-sm"
            autoFocus={autoFocus}
          />
          {statusIcon && (
            <button
              type="button"
              onClick={() => (statusIcon.clearInput ? onUrlChange('') : {})}
              className="flex items-center self-stretch pr-2"
            >
              {statusIcon.icon}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handlePaste}
          title={t('input.template-url.paste')}
          className="self-stretch border-l border-gray-200 bg-gray-50 px-2 text-gray-500
            transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <ClipboardIcon className="h-4 w-4" />
        </button>
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
