import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type ErrorDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
};

export function ErrorDialog({ isOpen, title, message, details, onClose }: ErrorDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-auto max-w-[90vw] min-w-[20rem] rounded-lg bg-white text-left shadow-xl
            sm:max-w-3xl sm:min-w-[28rem]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="ml-auto rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            <p className="text-gray-600">{message}</p>

            {details && (
              <pre
                className="mt-3 max-h-[60vh] overflow-auto rounded bg-gray-100 p-3 font-mono text-sm
                  break-words whitespace-pre-wrap text-gray-700"
              >
                {details}
              </pre>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end border-t border-gray-200 px-4 py-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700
                hover:bg-gray-200"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
