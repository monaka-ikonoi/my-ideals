import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ButtonStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  options: {
    label: string;
    value: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
  onSelect: (value: string) => void;
  onCancel: () => void;
  showCancel?: boolean;
};

export function ConfirmDialog({
  isOpen,
  title,
  children,
  options,
  onSelect,
  onCancel,
  showCancel = true,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" />
      {/* Dialog */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 text-left"
        onClick={onCancel}
      >
        <div
          className="w-auto max-w-[90vw] min-w-[20rem] rounded-lg bg-white shadow-xl sm:max-w-3xl
            sm:min-w-[28rem]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onCancel} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-4 text-gray-600">{children}</div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
            {showCancel && (
              <button
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {t('common.cancel')}
              </button>
            )}
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${ ButtonStyles[option.variant
                ?? 'secondary'] } `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
