import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
import { ExclamationTriangleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { LanguageDropdown } from '../LanguageDropdown';
import { CommonBackdrop } from '../ui/CommonBackdrop';

export function DisclaimerDialog() {
  const { t, i18n } = useTranslation();
  const disclaimerAccepted = useSettingsStore(state => state.disclaimerAccepted);

  const [isChecked, setIsChecked] = useState(false);

  const handleConfirm = () => {
    if (isChecked) {
      useSettingsStore.setState({ disclaimerAccepted: true });
    }
  };

  if (disclaimerAccepted) return null;

  return (
    <CommonBackdrop>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div
            className="flex items-center justify-between border-b border-gray-200 bg-amber-50 px-6
              py-4"
          >
            <h2 className="flex items-center gap-2 text-xl font-bold text-amber-800">
              <ExclamationTriangleIcon className="h-6 w-6" />
              {t('dialog.disclaimer.title')}
            </h2>

            <LanguageDropdown />
          </div>

          {/* Content */}
          <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
            <div className="space-y-3 text-sm text-gray-600">
              <p>{t('dialog.disclaimer.content.p1')}</p>
              <p>{t('dialog.disclaimer.content.p2')}</p>
              <p className="font-bold text-gray-800">{t('dialog.disclaimer.content.p3')}</p>
              <p>{t('dialog.disclaimer.content.p4')}</p>
              <a
                href={`https://github.com/monaka-ikonoi/my-ideals/blob/main/README.${i18n.language}.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800
                  hover:underline"
              >
                {t('settings.help')}
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <label className="mb-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={e => setIsChecked(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 accent-blue-600
                  focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{t('dialog.disclaimer.checkbox')}</span>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!isChecked}
              className={`w-full rounded-lg px-4 py-2.5 text-base font-medium transition-colors ${
                isChecked
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }`}
            >
              {t('dialog.disclaimer.confirm')}
            </button>
          </div>
        </div>
      </div>
    </CommonBackdrop>
  );
}
