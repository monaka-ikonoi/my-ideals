import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useActiveProfileStore } from '@/stores/activeProfileStore';

export function NotEqualMeBanner() {
  const { t } = useTranslation();

  const templateId = useActiveProfileStore(state => state.template?.id ?? '');

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('ios-itp-warning-dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed || !templateId.includes('not-equal-me')) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3
        text-base text-red-900"
    >
      <ExclamationCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-red-900" />

      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">ノイミー新メンバー断固反対！</p>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="hover:text-red-1000 shrink-0 rounded p-1 text-red-900 transition-colors"
        aria-label={t('common.close')}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
