type OptionPickerProps<T extends string> = {
  columns: number;
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function OptionPicker<T extends string>({
  columns,
  options,
  value,
  onChange,
  className,
}: OptionPickerProps<T>) {
  return (
    <div className={className}>
      <div
        className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-2"
        style={{ '--cols': columns } as React.CSSProperties}
      >
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={option.disabled}
            className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition
            disabled:cursor-not-allowed disabled:opacity-50 ${
              option.value === value
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
