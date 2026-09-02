import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { RecordFieldView } from '@/domain/profile';
import {
  BADGE_PROPS,
  resolveBadgeVariant,
  type BadgeMap,
  type BadgeProps,
} from '../card/BadgeProps';
import { DropdownSelect } from '../ui/DropdownSelect';
import { OptionPicker } from '../ui/OptionPicker';
import { SwatchPicker } from '../ui/SwatchPicker';
import { resolveFieldViewName } from '@/utils/recordUtils';

const labelClass = 'mb-2 text-sm font-medium text-gray-700';

type BadgeOptionsEditorProps = {
  fieldViews: RecordFieldView[];
  badges: BadgeMap;
  /** Preset modes have a single fixed badge and keep the plain pickers. */
  multiple: boolean;
  disabled: boolean;
  onChange: (badges: BadgeMap) => void;
};

export function BadgeOptionsEditor({
  fieldViews,
  badges,
  multiple,
  disabled,
  onChange,
}: BadgeOptionsEditorProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = fieldViews.filter(fieldView => badges[fieldView.id]);

  const patch = (fieldViewId: string, changes: Partial<BadgeProps>) =>
    onChange({ ...badges, [fieldViewId]: { ...badges[fieldViewId], ...changes } });

  const remove = (fieldViewId: string) => {
    setExpandedId(current => (current === fieldViewId ? null : current));
    onChange(Object.fromEntries(Object.entries(badges).filter(([id]) => id !== fieldViewId)));
  };

  const add = () => {
    const fieldView = fieldViews.find(candidate => !badges[candidate.id]);
    if (!fieldView) return;

    const [existing] = Object.values(badges);
    setExpandedId(fieldView.id);
    onChange({
      ...badges,
      [fieldView.id]: {
        position: existing?.position ?? BADGE_PROPS.defaults.position,
        size: existing?.size ?? BADGE_PROPS.defaults.size,
        color: existing?.color ?? BADGE_PROPS.defaults.color,
        variant: existing?.variant,
        icon: existing?.icon ?? BADGE_PROPS.defaults.icon,
      },
    });
  };

  const changeField = (fromId: string, toId: string) => {
    const moved = badges[fromId];
    if (!moved) return;

    setExpandedId(toId);
    onChange({
      ...Object.fromEntries(Object.entries(badges).filter(([id]) => id !== fromId)),
      [toId]: moved,
    });
  };

  return (
    <>
      <div className="space-y-2">
        {active.map(fieldView => {
          const badge = badges[fieldView.id];
          const activeColor = badge.color ?? BADGE_PROPS.defaults.color;
          const activeVariant = resolveBadgeVariant(badge.variant, fieldView);
          const activeIcon = badge.icon ?? BADGE_PROPS.defaults.icon;
          const ActiveIcon = BADGE_PROPS.icons[activeIcon];
          const expanded = !multiple || expandedId === fieldView.id;

          const summary: React.ReactNode[] = [
            t(`dialog.image-generate.options.position.${badge.position}`),
            t(`dialog.image-generate.options.size.${badge.size}`),
            <span
              key="color"
              className={`size-3.5 shrink-0 rounded-sm border border-gray-300
              ${activeColor === 'white' ? 'bg-white' : `bg-${activeColor}-500`}`}
            />,
            t(`dialog.image-generate.options.variant.${activeVariant}`),
            ...(BADGE_PROPS.variantParts[activeVariant].icon
              ? [<ActiveIcon key="icon" className="size-3.5 shrink-0" />]
              : []),
          ];

          return (
            <div
              key={fieldView.id}
              className={multiple ? 'space-y-4 rounded-xl border border-gray-200 p-3' : 'space-y-6'}
            >
              {multiple && (
                <div className="flex items-center gap-x-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : fieldView.id)}
                    className="flex min-w-0 flex-1 items-center gap-x-2 overflow-hidden text-left"
                  >
                    {expanded ? (
                      <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    )}
                    <span className="shrink-0 text-sm font-medium text-gray-700">
                      {resolveFieldViewName(t, fieldView)}
                    </span>

                    {!expanded && (
                      <span
                        className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs
                          leading-5 whitespace-nowrap text-gray-500"
                      >
                        {summary.map((part, index) => (
                          <Fragment key={index}>
                            {index > 0 && <span className="text-gray-300">/</span>}
                            {part}
                          </Fragment>
                        ))}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(fieldView.id)}
                    disabled={disabled}
                    title={t('common.delete')}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600
                      disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {expanded && (
                <>
                  {multiple && (
                    <div>
                      <p className={labelClass}>
                        {t('dialog.image-generate.options.badge-field-label')}
                      </p>
                      <DropdownSelect
                        options={fieldViews.map(option => ({
                          value: option.id,
                          label: resolveFieldViewName(t, option),
                          disabled: !!badges[option.id] && option.id !== fieldView.id,
                        }))}
                        value={fieldView.id}
                        disabled={disabled}
                        onChange={toId => changeField(fieldView.id, toId)}
                      />
                    </div>
                  )}

                  <div>
                    <p className={labelClass}>
                      {t('dialog.image-generate.options.badge-position-label')}
                    </p>
                    <OptionPicker
                      columns={3}
                      options={BADGE_PROPS.positions.map(position => ({
                        value: position,
                        label: t(`dialog.image-generate.options.position.${position}`),
                        disabled,
                      }))}
                      value={badge.position}
                      onChange={position => patch(fieldView.id, { position })}
                    />
                  </div>

                  <div>
                    <p className={labelClass}>
                      {t('dialog.image-generate.options.badge-size-label')}
                    </p>
                    <OptionPicker
                      columns={4}
                      options={BADGE_PROPS.sizes.map(size => ({
                        value: size,
                        label: t(`dialog.image-generate.options.size.${size}`),
                        disabled,
                      }))}
                      value={badge.size}
                      onChange={size => patch(fieldView.id, { size })}
                    />
                  </div>

                  <div>
                    <p className={labelClass}>
                      {t('dialog.image-generate.options.badge-color-label')}
                    </p>
                    <SwatchPicker
                      options={BADGE_PROPS.colors.map(color => ({
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
                      onChange={color => patch(fieldView.id, { color })}
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
                          options={BADGE_PROPS.variants
                            .filter(
                              variant =>
                                fieldView.source.type === 'number' ||
                                !BADGE_PROPS.variantParts[variant].number
                            )
                            .map(variant => ({
                              value: variant,
                              label: t(`dialog.image-generate.options.variant.${variant}`),
                              disabled,
                            }))}
                          value={activeVariant}
                          onChange={variant => patch(fieldView.id, { variant })}
                        />
                      </div>

                      {BADGE_PROPS.variantParts[activeVariant].icon && (
                        <div>
                          <p className={labelClass}>
                            {t('dialog.image-generate.options.badge-icon-label')}
                          </p>
                          <SwatchPicker
                            options={BADGE_PROPS.iconIds.map(icon => {
                              const Icon = BADGE_PROPS.icons[icon];
                              return {
                                value: icon,
                                content: <Icon className="h-4 w-4" />,
                              };
                            })}
                            value={activeIcon}
                            disabled={disabled}
                            onChange={icon => patch(fieldView.id, { icon })}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {multiple && active.length < fieldViews.length && (
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
