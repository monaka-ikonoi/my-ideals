import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { RecordField } from '@/domain/profile';
import {
  BADGE_COLORS,
  BADGE_VARIANTS,
  BADGE_VARIANT_PARTS,
  BADGE_ICONS,
  BADGE_ICON_IDS,
  BADGE_POSITIONS,
  BADGE_SIZES,
  DEFAULT_BADGE_POSITION,
  DEFAULT_BADGE_SIZE,
  DEFAULT_BADGE_COLOR,
  DEFAULT_BADGE_ICON,
  resolveBadgeVariant,
  type BadgeMap,
  type BadgeProps,
} from '../card/CountBadgeProps';
import { DropdownSelect } from '../ui/DropdownSelect';
import { OptionPicker } from '../ui/OptionPicker';
import { SwatchPicker } from '../ui/SwatchPicker';

const labelClass = 'mb-2 text-sm font-medium text-gray-700';

type BadgeOptionsEditorProps = {
  fields: RecordField[];
  badges: BadgeMap;
  /** Preset modes have a single fixed badge and keep the plain pickers. */
  multiple: boolean;
  disabled: boolean;
  onChange: (badges: BadgeMap) => void;
};

export function BadgeOptionsEditor({
  fields,
  badges,
  multiple,
  disabled,
  onChange,
}: BadgeOptionsEditorProps) {
  const { t } = useTranslation();

  const active = fields.filter(field => badges[field.id]);

  const patch = (fieldId: string, changes: Partial<BadgeProps>) =>
    onChange({ ...badges, [fieldId]: { ...badges[fieldId], ...changes } });

  const remove = (fieldId: string) =>
    onChange(Object.fromEntries(Object.entries(badges).filter(([id]) => id !== fieldId)));

  const add = () => {
    const field = fields.find(candidate => !badges[candidate.id]);
    if (!field) return;

    const [existing] = Object.values(badges);
    onChange({
      ...badges,
      [field.id]: {
        position: existing?.position ?? DEFAULT_BADGE_POSITION,
        size: existing?.size ?? DEFAULT_BADGE_SIZE,
        color: existing?.color ?? DEFAULT_BADGE_COLOR,
        variant: existing?.variant,
        icon: existing?.icon ?? DEFAULT_BADGE_ICON,
      },
    });
  };

  const changeField = (fromId: string, toId: string) => {
    const moved = badges[fromId];
    if (!moved) return;

    onChange({
      ...Object.fromEntries(Object.entries(badges).filter(([id]) => id !== fromId)),
      [toId]: moved,
    });
  };

  return (
    <>
      <div className="space-y-2">
        {active.map(field => {
          const badge = badges[field.id];
          const activeColor = badge.color ?? DEFAULT_BADGE_COLOR;
          const activeVariant = resolveBadgeVariant(badge.variant, field);
          const activeIcon = badge.icon ?? DEFAULT_BADGE_ICON;

          return (
            <div
              key={field.id}
              className={multiple ? 'space-y-4 rounded-xl border border-gray-200 p-3' : 'space-y-6'}
            >
              {multiple && (
                <div className="flex items-center gap-x-3">
                  <DropdownSelect
                    className="w-32"
                    options={fields.map(option => ({
                      value: option.id,
                      label: option.name,
                      disabled: !!badges[option.id] && option.id !== field.id,
                    }))}
                    value={field.id}
                    disabled={disabled}
                    onChange={toId => changeField(field.id, toId)}
                  />

                  <button
                    type="button"
                    onClick={() => remove(field.id)}
                    disabled={disabled}
                    title={t('common.delete')}
                    className="ml-auto rounded p-1 text-gray-400 hover:bg-gray-100
                      hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30
                      disabled:hover:bg-transparent"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div>
                <p className={labelClass}>
                  {t('dialog.image-generate.options.badge-position-label')}
                </p>
                <OptionPicker
                  columns={3}
                  options={BADGE_POSITIONS.map(position => ({
                    value: position,
                    label: t(`dialog.image-generate.options.position.${position}`),
                    disabled,
                  }))}
                  value={badge.position}
                  onChange={position => patch(field.id, { position })}
                />
              </div>

              <div>
                <p className={labelClass}>{t('dialog.image-generate.options.badge-size-label')}</p>
                <OptionPicker
                  columns={4}
                  options={BADGE_SIZES.map(size => ({
                    value: size,
                    label: t(`dialog.image-generate.options.size.${size}`),
                    disabled,
                  }))}
                  value={badge.size}
                  onChange={size => patch(field.id, { size })}
                />
              </div>

              <div>
                <p className={labelClass}>{t('dialog.image-generate.options.badge-color-label')}</p>
                <SwatchPicker
                  options={BADGE_COLORS.map(color => ({
                    value: color,
                    content: (
                      <span
                        className={`size-full rounded-md
                        ${color === 'white' ? 'bg-white' : `bg-${color}-500`}`}
                      />
                    ),
                  }))}
                  value={activeColor}
                  disabled={disabled}
                  onChange={color => patch(field.id, { color })}
                />
              </div>

              {multiple && (
                <>
                  <div>
                    <p className={labelClass}>
                      {t('dialog.image-generate.options.badge-variant-label')}
                    </p>
                    <OptionPicker
                      columns={3}
                      options={BADGE_VARIANTS.filter(
                        variant => field.type === 'number' || !BADGE_VARIANT_PARTS[variant].number
                      ).map(variant => ({
                        value: variant,
                        label: t(`dialog.image-generate.options.variant.${variant}`),
                        disabled,
                      }))}
                      value={activeVariant}
                      onChange={variant => patch(field.id, { variant })}
                    />
                  </div>

                  {BADGE_VARIANT_PARTS[activeVariant].icon && (
                    <div>
                      <p className={labelClass}>
                        {t('dialog.image-generate.options.badge-icon-label')}
                      </p>
                      <SwatchPicker
                        options={BADGE_ICON_IDS.map(icon => {
                          const Icon = BADGE_ICONS[icon];
                          return {
                            value: icon,
                            content: <Icon className="h-4 w-4" />,
                          };
                        })}
                        value={activeIcon}
                        disabled={disabled}
                        onChange={icon => patch(field.id, { icon })}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {multiple && active.length < fields.length && (
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border
            border-dashed border-gray-300 py-3 text-sm text-gray-500 transition
            hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed
            disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          {t('dialog.image-generate.options.badge-add')}
        </button>
      )}
    </>
  );
}
