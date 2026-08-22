import { type ItemRecord, type RecordField, type RecordValue } from '@/domain/profile';
import { readField } from '@/utils/recordUtils';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';
import { type ItemCardMode } from './types';
import { ItemCounter } from './ItemCounter';

type RecordFieldRowProps = {
  field: RecordField;
  value: RecordValue;
  showLabel: boolean;
  mode: ItemCardMode;
  onChange: (value: RecordValue) => void;
};

export function RecordFieldRow({ field, value, showLabel, mode, onChange }: RecordFieldRowProps) {
  return (
    <div className="flex items-stretch">
      {showLabel && (
        <span
          className={`w-2/5 shrink-0 overflow-hidden bg-gray-100 px-2 text-clip whitespace-nowrap
          text-gray-500 ${mode === 'edit' ? 'h-10 text-sm leading-10' : 'h-8 text-xs leading-8'}`}
        >
          {field.name}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {field.type === 'number' ? (
          <ItemCounter
            value={normalizeStatusNumber(value)}
            setValue={onChange}
            mode={mode === 'edit' ? 'edit' : 'normal'}
          />
        ) : (
          <button
            type="button"
            onClick={() => onChange(!normalizeStatusBoolean(value))}
            className={`flex w-full items-center justify-center bg-gray-100 transition
              hover:bg-gray-200 active:bg-gray-300 ${mode === 'edit' ? 'h-10' : 'h-8'}`}
          >
            <input
              readOnly
              type="checkbox"
              checked={normalizeStatusBoolean(value)}
              className={`pointer-events-none accent-blue-600
                ${mode === 'edit' ? 'h-5 w-5' : 'h-4 w-4'}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

type RecordFieldListProps = {
  fields: RecordField[];
  record: ItemRecord | undefined;
  showLabel: boolean;
  mode: ItemCardMode;
  onChange: (fieldId: string, value: RecordValue) => void;
};

export function RecordFieldList({
  fields,
  record,
  showLabel,
  mode,
  onChange,
}: RecordFieldListProps) {
  return (
    <div className="flex flex-col gap-px">
      {fields.map(field => (
        <RecordFieldRow
          key={field.id}
          field={field}
          value={readField(record, field)}
          showLabel={showLabel}
          mode={mode}
          onChange={value => onChange(field.id, value)}
        />
      ))}
    </div>
  );
}
