import { LanguageIcon } from '@heroicons/react/24/outline';
import i18n, { supportedLanguages } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';
import { DropdownSelect } from './ui/DropdownSelect';

export function LanguageDropdown({ className }: { className?: string }) {
  const currentLanguage = useSettingsStore(state => state.language);

  const options = supportedLanguages.map(lang => ({
    value: lang,
    label: i18n.getFixedT(lang)('language.name'),
  }));

  return (
    <DropdownSelect
      className={`min-w-32 ${className ?? ''}`}
      icon={<LanguageIcon className="h-4 w-4" />}
      options={options}
      value={currentLanguage}
      onChange={lang => useSettingsStore.getState().setLanguage(lang)}
    />
  );
}
