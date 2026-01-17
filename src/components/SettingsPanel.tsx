import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';

type SettingsPanelProps = {
  onSelect?: () => void;
};

export function SettingsPanel({ onSelect }: SettingsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="py-1">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
        {t('settings.language')}
      </div>

      <LanguageSelector onSelect={onSelect} />
    </div>
  );
}
