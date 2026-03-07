import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

type FullScreenModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function FullScreenModal({ isOpen, onClose, title, children }: FullScreenModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex md:items-center md:justify-center md:bg-black/50 md:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col bg-white md:h-auto md:max-h-[90vh] md:min-h-[60vh]
          md:w-full md:max-w-4xl md:rounded-xl md:shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3
            md:px-6 md:py-4"
        >
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body
  );
}
