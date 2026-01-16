import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '@/stores/settingsStore';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

type SettingsPanelProps = {
  onSelect?: () => void;
};

export function SettingsPanel({ onSelect }: SettingsPanelProps) {
  const { t, i18n } = useTranslation();

  const handleSelectLanguage = (code: string) => {
    useSettingsStore.getState().setLanguage(code);
    onSelect?.();
  };

  return (
    <div className="py-1">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
        {t('settings.language')}
      </div>

      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleSelectLanguage(lang.code)}
          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
            i18n.language === lang.code
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i18n.language === lang.code ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <span className="w-4" />
          )}
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
