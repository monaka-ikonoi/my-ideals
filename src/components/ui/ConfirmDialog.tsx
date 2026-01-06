import type { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  options: {
    label: string;
    value: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
  onSelect: (value: string) => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  options,
  onSelect,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-auto max-w-[90vw] min-w-[20rem] rounded-lg bg-white shadow-xl sm:max-w-3xl
            sm:min-w-[28rem]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onCancel} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
            <button
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${ variantStyles[option.variant
                ?? 'secondary'] } `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
