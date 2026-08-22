import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';
import { RecordModes, type RecordMode } from '@/domain/profile';
import { getActiveProfile, useActiveProfile } from '@/stores/profileSessionStore';
import {
  buildRecordFieldDrafts,
  validateRecordFieldDrafts,
  parseRecordFieldDrafts,
} from './RecordFieldDrafts';
import { RecordFieldsEditor } from './RecordFieldsEditor';
import { DropdownSelect } from '../ui/DropdownSelect';
import { FullScreenModal } from '../ui/FullScreenModal';

type RecordFieldsModalProps = {
  onClose: () => void;
};

export function RecordFieldsModal({ onClose }: RecordFieldsModalProps) {
  const { t } = useTranslation();

  const { currentMode, fields } = useActiveProfile(
    useShallow(state => ({ currentMode: state.profile.mode, fields: state.fields }))
  );

  const [mode, setMode] = useState<RecordMode>(currentMode);
  const [drafts, setDrafts] = useState(() => buildRecordFieldDrafts(fields));

  const handleSave = () => {
    getActiveProfile().setMode(
      mode,
      mode === 'custom' ? parseRecordFieldDrafts(drafts) : undefined
    );
    onClose();
  };
  return (
    <FullScreenModal isOpen title={t('dialog.record-fields.title')} onClose={onClose}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:px-6">
          <div className="mb-4 space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('profile.mode.label')}
            </label>
            <DropdownSelect
              disabled={currentMode === 'custom'}
              options={RecordModes.map(mode => ({
                value: mode,
                label:
                  t(`profile.mode.${mode}`) +
                  (mode === currentMode ? ` (${t('dialog.record-fields.current-tag')})` : ''),
              }))}
              value={mode}
              onChange={setMode}
            />
            {currentMode === 'count' && mode === 'standard' && (
              <p className="text-xs text-red-600">
                {t('dialog.record-fields.count-to-standard-warn')}
              </p>
            )}
          </div>

          {mode === 'custom' && <RecordFieldsEditor drafts={drafts} onChange={setDrafts} />}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={mode === 'custom' && !validateRecordFieldDrafts(drafts)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
              hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </FullScreenModal>
  );
}
