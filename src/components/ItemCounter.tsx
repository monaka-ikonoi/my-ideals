import { useState, useCallback, useRef, useEffect } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

type ItemCounterProps = {
  value: number;
  setValue: (value: number) => void;
};

export function ItemCounter({ value, setValue }: ItemCounterProps) {
  const [editorActive, setEditorActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorActive && inputRef.current) {
      inputRef.current.value = value.toString();
      inputRef.current.select();
    }
  }, [editorActive, value]);

  const handleStartEdit = useCallback(() => {
    setEditorActive(true);
  }, []);

  const handleConfirmEdit = useCallback(() => {
    if (!inputRef.current) return;
    const parsed = parseInt(inputRef.current.value, 10);
    const clamped = Number.isSafeInteger(parsed) ? Math.max(parsed, 0) : 0;
    setValue(clamped);
    setEditorActive(false);
  }, [setValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleConfirmEdit();
      if (e.key === 'Escape') setEditorActive(false);
    },
    [handleConfirmEdit]
  );

  return (
    <div className="flex items-center justify-between bg-gray-100 p-1">
      <button
        type="button"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-gray-500
          transition hover:bg-gray-200 active:bg-gray-300 disabled:cursor-not-allowed
          disabled:opacity-30 sm:h-6 sm:w-6"
        onClick={() => setValue(value - 1)}
        disabled={value === 0}
      >
        <MinusIcon className="h-3 w-4 sm:h-4" />
      </button>

      <div
        className="mx-1 max-w-10 flex-1 items-center justify-center text-sm font-semibold
          text-gray-700 tabular-nums sm:mx-1.5 sm:h-6 sm:max-w-12 sm:text-base"
      >
        {editorActive ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            defaultValue={value}
            onBlur={handleConfirmEdit}
            onKeyDown={handleKeyDown}
            className="font-inherit h-full w-full [appearance:textfield] rounded bg-gray-200 px-1
              text-center text-inherit tabular-nums outline-none focus:bg-gray-300
              [&::-webkit-inner-spin-button]:appearance-none
              [&::-webkit-outer-spin-button]:appearance-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => handleStartEdit()}
            className="h-full w-full rounded transition hover:bg-gray-200"
          >
            {value}
          </button>
        )}
      </div>

      <button
        type="button"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-gray-500
          transition hover:bg-gray-200 active:bg-gray-300 sm:h-6 sm:w-6"
        onClick={() => setValue(value + 1)}
      >
        <PlusIcon className="h-3 w-4 sm:h-4" />
      </button>
    </div>
  );
}
