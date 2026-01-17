import { CheckIcon } from '@heroicons/react/24/outline';
import i18n, { supportedLanguages } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';

export function LanguageSelector({ onSelect }: { onSelect?: () => void }) {
  const currentLanguage = useSettingsStore(state => state.language);

  const handleSelectLanguage = (code: string) => {
    useSettingsStore.getState().setLanguage(code);
    onSelect?.();
  };

  return (
    <>
      {supportedLanguages.map(lang => (
        <button
          key={lang}
          onClick={() => handleSelectLanguage(lang)}
          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
            lang === currentLanguage
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {lang === currentLanguage ? <CheckIcon className="h-4 w-4" /> : <span className="w-4" />}
          <span>{i18n.getFixedT(lang)('language.name')}</span>
        </button>
      ))}
    </>
  );
}
