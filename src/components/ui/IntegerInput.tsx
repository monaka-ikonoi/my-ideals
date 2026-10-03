import type { ComponentProps } from 'react';

type IntegerInputProps = Omit<
  ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'
> & {
  defaultValue: number;
  onValueChange?: (value: number) => void;
  onCommit?: (value: number) => void;
};

export function IntegerInput({
  defaultValue,
  onValueChange,
  onCommit,
  ...props
}: IntegerInputProps) {
  return (
    <input
      {...props}
      type="number"
      defaultValue={defaultValue}
      onChange={event => {
        const parsed = parseInt(event.currentTarget.value, 10);
        if (Number.isSafeInteger(parsed)) onValueChange?.(parsed);
      }}
      onBlur={event => {
        const parsed = parseInt(event.currentTarget.value, 10);
        const settled = Number.isSafeInteger(parsed) ? parsed : 0;
        event.currentTarget.value = String(settled);
        onValueChange?.(settled);
        onCommit?.(settled);
      }}
    />
  );
}
