type SwatchPickerProps<T extends string> = {
  options: { value: T; content: React.ReactNode }[];
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
};

export function SwatchPicker<T extends string>({
  options,
  value,
  disabled,
  onChange,
}: SwatchPickerProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-label="swatch"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`flex size-8 items-center justify-center rounded-lg border border-gray-300
          text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-50
          ${option.value === value ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
        >
          {option.content}
        </button>
      ))}
    </div>
  );
}
