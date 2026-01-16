import { useTranslation } from 'react-i18next';

export function LoadingPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
        />
        <span className="text-sm text-gray-500">{t('common.loading')}</span>
      </div>
    </div>
  );
}
