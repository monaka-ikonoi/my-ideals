import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { useDialogStore } from '@/stores/dialogStore';
import {
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { DebugSettings } from './DebugSettings';

type SettingsPanelProps = {
  onSelect?: () => void;
};

export function SettingsPanel({ onSelect }: SettingsPanelProps) {
  const { t, i18n } = useTranslation();

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
        <a
          href={`https://github.com/monaka-ikonoi/my-ideals/blob/main/README.${i18n.language}.md`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onSelect?.()}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700
            hover:bg-gray-100"
        >
          <QuestionMarkCircleIcon className="h-4 w-4" />
          {t('settings.help')}
          <ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 text-gray-400" />
        </a>
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

      <DebugSettings onSelect={onSelect} />
    </>
  );
}
