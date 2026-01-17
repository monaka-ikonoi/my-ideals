import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { LanguageSelector } from './LanguageSelector';

export function LanguageDropdown({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className={`relative min-w-32 ${className ?? ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300
          bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        <LanguageIcon className="h-4 w-4" />
        <span>{t('language.name')}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border
            border-gray-200 bg-white py-1 shadow-lg"
        >
          <LanguageSelector onSelect={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
