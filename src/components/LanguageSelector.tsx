import { CheckIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '@/stores/settingsStore';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export function LanguageSelector({ onSelect }: { onSelect?: () => void }) {
  const currentLanguage = useSettingsStore(state => state.language);

  const handleSelectLanguage = (code: string) => {
    useSettingsStore.getState().setLanguage(code);
    onSelect?.();
  };

  return (
    <>
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleSelectLanguage(lang.code)}
          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
            lang.code === currentLanguage
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {lang.code === currentLanguage ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <span className="w-4" />
          )}
          <span>{lang.label}</span>
        </button>
      ))}
    </>
  );
}
