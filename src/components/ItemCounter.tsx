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
    <div className="flex h-8 items-center justify-between overflow-hidden bg-gray-100">
      <button
        type="button"
        className="flex h-full w-8 shrink-0 items-center justify-center text-gray-500 transition
          hover:bg-gray-200 active:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-30"
        onClick={() => setValue(value - 1)}
        disabled={value === 0}
      >
        <MinusIcon className="h-4 w-4" />
      </button>

      <div
        className="h-full min-w-[2rem] flex-1 items-center justify-center text-base font-semibold
          text-gray-700 tabular-nums"
      >
        {editorActive ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            defaultValue={value}
            onBlur={handleConfirmEdit}
            onKeyDown={handleKeyDown}
            className="font-inherit h-full w-full [appearance:textfield] bg-gray-200 px-1
              text-center text-inherit tabular-nums outline-none focus:bg-gray-300
              [&::-webkit-inner-spin-button]:appearance-none
              [&::-webkit-outer-spin-button]:appearance-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => handleStartEdit()}
            className="h-full w-full transition hover:bg-gray-200"
          >
            {value}
          </button>
        )}
      </div>

      <button
        type="button"
        className="flex h-full w-8 shrink-0 items-center justify-center text-gray-500 transition
          hover:bg-gray-200 active:bg-gray-300"
        onClick={() => setValue(value + 1)}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
