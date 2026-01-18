import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { useDialogStore } from '@/stores/dialogStore';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

type SettingsPanelProps = {
  onSelect?: () => void;
};

export function SettingsPanel({ onSelect }: SettingsPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="py-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
          {t('settings.language')}
        </div>

        <LanguageSelector onSelect={onSelect} />
      </div>

      <div className="border-t border-gray-200" />

      <div className="py-1">
        <button
          onClick={() => {
            useDialogStore.getState().openAbout();
            onSelect?.();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <InformationCircleIcon className="h-4 w-4" />
          {t('dialog.about.title')}
        </button>
      </div>
    </>
  );
}
