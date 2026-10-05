import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { isEqual } from 'lodash-es';
import type { RecordField } from '@/domain/profile';
import type { FilterExpression, FilterGroup, FilterNode } from '@/services/filter';
import { useActiveProfile, useProfileSessionStore } from '@/stores/profileSessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { resolveSpecialFieldName } from '@/utils/recordUtils';
import {
  FILTER_GROUP_MAX_DEPTH,
  createConditionDraft,
  createGroupDraft,
  getDraftGroupHeight,
  parseFilterDraft,
  toFilterDraft,
  updateDraftChild,
  type ConditionDraft,
  type GroupDraft,
} from './collectionFilterDraft';
import { DropdownSelect, type DropdownOption } from '../ui/DropdownSelect';
import { FullScreenModal } from '../ui/FullScreenModal';
import { IntegerInput } from '../ui/IntegerInput';

const FILTER_HISTORY_LIMIT = 5;

const OperatorOptions: DropdownOption<ConditionDraft['op']>[] = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'eq', label: '=' },
  { value: 'lte', label: '≤' },
  { value: 'lt', label: '<' },
];

type NodeActionsProps = {
  onWrap?: () => void;
  onRemove: () => void;
  canWrap?: boolean;
};

function NodeActions({ onWrap, onRemove, canWrap = true }: NodeActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="ml-auto flex shrink-0 items-center">
      {onWrap && (
        <button
          type="button"
          onClick={onWrap}
          disabled={!canWrap}
          className="rounded px-1.5 py-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600
            disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('dialog.collection-filter.wrap')}
          title={t(
            canWrap ? 'dialog.collection-filter.wrap' : 'dialog.collection-filter.max-depth'
          )}
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="rounded px-1.5 py-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
        aria-label={t('common.delete')}
        title={t('common.delete')}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

type ConditionRowProps = {
  draft: ConditionDraft;
  fields: RecordField[];
  onChange: (patch: Partial<Omit<ConditionDraft, 'kind' | 'key'>>) => void;
  onWrap: () => void;
  onRemove: () => void;
  depth: number;
};

function ConditionRow({ draft, fields, onChange, onWrap, onRemove, depth }: ConditionRowProps) {
  const { t } = useTranslation();
  const field = fields.find(candidate => candidate.id === draft.fieldId);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <DropdownSelect
        className="min-w-0 flex-[1_1_4.5rem]"
        options={fields.map(candidate => ({
          value: candidate.id,
          label: resolveSpecialFieldName(t, candidate),
        }))}
        value={draft.fieldId}
        onChange={fieldId => onChange({ fieldId })}
        placeholder={draft.fieldId}
      />

      {field?.type === 'number' ? (
        <div className="flex w-34 max-w-full shrink-0 flex-wrap items-center gap-1">
          <DropdownSelect
            className="w-16"
            options={OperatorOptions}
            value={draft.op}
            onChange={op => onChange({ op })}
          />
          <IntegerInput
            aria-label={resolveSpecialFieldName(t, field)}
            defaultValue={draft.value}
            onValueChange={value => onChange({ value })}
            className="w-16 shrink-0 grow rounded-lg border border-gray-300 px-2 py-2 text-center
              text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      ) : (
        <DropdownSelect
          className="w-34 max-w-full shrink-0"
          options={[
            { value: 'checked', label: t('dialog.collection-filter.checked') },
            { value: 'unchecked', label: t('dialog.collection-filter.unchecked') },
          ]}
          value={draft.checked ? 'checked' : 'unchecked'}
          onChange={value => onChange({ checked: value === 'checked' })}
        />
      )}

      <NodeActions onWrap={onWrap} onRemove={onRemove} canWrap={depth < FILTER_GROUP_MAX_DEPTH} />
    </div>
  );
}

type GroupEditorProps = {
  group: GroupDraft;
  fields: RecordField[];
  onChange: (update: (current: GroupDraft) => GroupDraft) => void;
  onRemove?: () => void;
  depth: number;
};

function GroupEditor({ group, fields, onChange, onRemove, depth }: GroupEditorProps) {
  const { t } = useTranslation();
  const indentChildren = group.children.length > 1 || group.children[0]?.kind === 'group';

  return (
    <section className="min-w-0 space-y-3">
      {group.children.map((node, index) => {
        const remove = () => onChange(current => updateDraftChild(current, node.key, () => null));
        return (
          <div
            key={node.key}
            className={`grid min-w-0 items-start gap-2 ${
              indentChildren ? 'grid-cols-[max-content_minmax(0,1fr)]' : 'grid-cols-1'
            }`}
          >
            {indentChildren && (
              <span
                aria-hidden={index === 0}
                className={`py-2 text-xs leading-5 whitespace-nowrap text-gray-500
                ${index === 0 ? 'invisible' : ''}`}
              >
                {t(`dialog.collection-filter.${group.operator}`)}
              </span>
            )}
            {node.kind === 'group' ? (
              <GroupEditor
                group={node}
                fields={fields}
                onChange={update =>
                  onChange(current =>
                    updateDraftChild(current, node.key, child =>
                      child.kind === 'group' ? update(child) : child
                    )
                  )
                }
                depth={depth + 1}
                onRemove={remove}
              />
            ) : (
              <ConditionRow
                draft={node}
                fields={fields}
                onChange={patch =>
                  onChange(current =>
                    updateDraftChild(current, node.key, child =>
                      child.kind === 'condition' ? { ...child, ...patch } : child
                    )
                  )
                }
                depth={depth}
                onWrap={() =>
                  onChange(current =>
                    updateDraftChild(current, node.key, child =>
                      depth < FILTER_GROUP_MAX_DEPTH && child.kind === 'condition'
                        ? createGroupDraft('and', [child])
                        : child
                    )
                  )
                }
                onRemove={remove}
              />
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-2">
        <DropdownSelect
          className="min-w-16 shrink-0"
          options={[
            { value: 'and', label: t('dialog.collection-filter.and') },
            { value: 'or', label: t('dialog.collection-filter.or') },
          ]}
          value={group.operator}
          onChange={operator => onChange(current => ({ ...current, operator }))}
        />
        <button
          type="button"
          onClick={() =>
            onChange(current => ({
              ...current,
              children: [...current.children, createConditionDraft(fields[0].id)],
            }))
          }
          className="flex shrink-0 items-center gap-1 rounded-xl border border-dashed
            border-gray-300 px-3 py-2 text-sm whitespace-nowrap text-gray-500 transition
            hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700"
        >
          <PlusIcon className="h-4 w-4 shrink-0" />
          {t('dialog.collection-filter.add')}
        </button>
        <button
          type="button"
          disabled={depth >= FILTER_GROUP_MAX_DEPTH}
          onClick={() => {
            if (depth >= FILTER_GROUP_MAX_DEPTH) return;
            onChange(current => ({
              ...current,
              children: [
                ...current.children,
                createGroupDraft('and', [createConditionDraft(fields[0].id)]),
              ],
            }));
          }}
          className="flex shrink-0 items-center gap-1 rounded-xl border border-dashed
            border-gray-300 px-3 py-2 text-sm whitespace-nowrap text-gray-500 transition
            hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed
            disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 shrink-0" />
          {t('dialog.collection-filter.add-group')}
        </button>
        {onRemove && <NodeActions onRemove={onRemove} />}
      </div>
      {depth >= FILTER_GROUP_MAX_DEPTH && (
        <p className="text-xs text-gray-400">{t('dialog.collection-filter.max-depth')}</p>
      )}
    </section>
  );
}

type CollectionFilterModalProps = {
  onClose: () => void;
};

export function CollectionFilterModal({ onClose }: CollectionFilterModalProps) {
  const { t } = useTranslation();
  const profileId = useActiveProfile(state => state.profile.id);
  const fields = useActiveProfile(state => state.fields);
  const filter = useProfileSessionStore(state => state.filter);
  const setFilterExpression = useProfileSessionStore(state => state.setFilterExpression);
  const storedHistory = useSettingsStore(state => state.profileOptions[profileId]?.filterHistory);
  const setProfileOptions = useSettingsStore(state => state.setProfileOptions);
  const [draft, setDraft] = useState<GroupDraft>(() => toFilterDraft(filter));
  const expression = useMemo(() => parseFilterDraft(draft, fields), [draft, fields]);
  const exceedsMaxDepth = getDraftGroupHeight(draft) > FILTER_GROUP_MAX_DEPTH;

  const history = useMemo(() => {
    const fieldsById = new Map(fields.map(field => [field.id, field]));
    const isAvailable = (node: FilterNode): boolean =>
      node.type === 'group'
        ? node.children.length > 0 && node.children.every(isAvailable)
        : fieldsById.get(node.fieldId)?.type === node.type;
    return (storedHistory ?? []).filter(isAvailable);
  }, [storedHistory, fields]);

  const formatExpression = useCallback(
    (expression: FilterExpression): string => {
      if (!expression) return t('dialog.collection-filter.empty-preview');
      const names = new Map(fields.map(field => [field.id, resolveSpecialFieldName(t, field)]));
      const format = (node: FilterNode): string => {
        if (node.type === 'group') {
          return `(${node.children.map(format).join(` ${node.operator.toUpperCase()} `)})`;
        }
        const name = names.get(node.fieldId) ?? node.fieldId;
        return node.type === 'number'
          ? `${name} ${OperatorOptions.find(option => option.value === node.op)!.label} ${node.value}`
          : `${name} ${node.value ? t('dialog.collection-filter.checked') : t('dialog.collection-filter.unchecked')}`;
      };
      return expression.children.map(format).join(` ${expression.operator.toUpperCase()} `);
    },
    [fields, t]
  );

  const addFilterHistory = (expression: FilterExpression) => {
    if (!expression || expression.children.length === 0) return;
    setProfileOptions(profileId, {
      filterHistory: [
        expression,
        ...(storedHistory ?? []).filter(entry => !isEqual(entry, expression)),
      ].slice(0, FILTER_HISTORY_LIMIT),
    });
  };

  const removeFilterHistory = (expression: FilterGroup) => {
    if (!storedHistory) return;
    setProfileOptions(profileId, {
      filterHistory: storedHistory.filter(entry => !isEqual(entry, expression)),
    });
  };

  const handleApply = (expression: FilterExpression) => {
    setFilterExpression(expression);
    addFilterHistory(expression);
    onClose();
  };

  const handleClear = () => {
    setFilterExpression(null);
    onClose();
  };

  return (
    <FullScreenModal isOpen title={t('dialog.collection-filter.title')} onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:px-6">
          <GroupEditor group={draft} fields={fields} onChange={setDraft} depth={1} />
          <div
            className="mt-3 rounded-lg bg-gray-50 p-3 text-sm leading-relaxed break-words
              text-gray-600"
          >
            {formatExpression(expression)}
          </div>
          {exceedsMaxDepth && (
            <p className="mt-2 text-sm text-red-600">
              {t('dialog.collection-filter.max-depth-exceeded')}
            </p>
          )}
          <section className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              {t('dialog.collection-filter.history')}
            </h3>
            {history.length > 0 ? (
              <ul className="space-y-2">
                {history.map(entry => (
                  <div
                    key={JSON.stringify(entry)}
                    className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200
                      pr-1.5 transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <button
                      type="button"
                      onClick={() => handleApply(entry)}
                      className="min-w-0 flex-1 self-stretch rounded-lg px-3 py-2 text-left text-sm
                        leading-relaxed break-words text-gray-600 transition-colors
                        hover:text-blue-700"
                    >
                      {formatExpression(entry)}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFilterHistory(entry)}
                      className="shrink-0 rounded px-1.5 py-2 text-gray-400 hover:bg-gray-100
                        hover:text-red-600"
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">{t('dialog.collection-filter.history-empty')}</p>
            )}
          </section>
        </div>
        <div
          className="flex shrink-0 flex-nowrap justify-end gap-2 overflow-x-auto border-t
            border-gray-200 px-4 py-3 sm:px-6"
        >
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap
              text-gray-700 hover:bg-gray-100"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium
              whitespace-nowrap text-gray-700 hover:bg-gray-200"
          >
            {t('dialog.collection-filter.clear')}
          </button>
          <button
            type="button"
            onClick={() => handleApply(expression)}
            disabled={exceedsMaxDepth}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium
              whitespace-nowrap text-white hover:bg-blue-700 disabled:cursor-not-allowed
              disabled:opacity-50"
          >
            {t('dialog.collection-filter.apply')}
          </button>
        </div>
      </div>
    </FullScreenModal>
  );
}
