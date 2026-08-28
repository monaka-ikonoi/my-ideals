import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';
import { RECORD_FIELDS_MAX, RecordModes, type RecordMode } from '@/domain/profile';
import {
  getActiveProfile,
  useActiveProfile,
  useProfileSessionStore,
} from '@/stores/profileSessionStore';
import {
  buildRecordFieldDrafts,
  parseRecordFieldDrafts,
  validateRecordFieldDrafts,
  splitCountModeFields,
} from './RecordFieldDrafts';
import { RecordFieldsEditor } from './RecordFieldsEditor';
import { DropdownSelect } from '../ui/DropdownSelect';
import { FullScreenModal } from '../ui/FullScreenModal';

type ProfileModeModalProps = {
  onClose: () => void;
};

export function ProfileModeModal({ onClose }: ProfileModeModalProps) {
  const { t } = useTranslation();

  const { currentMode, fields } = useActiveProfile(
    useShallow(state => ({ currentMode: state.profile.mode, fields: state.fields }))
  );

  const [mode, setMode] = useState<RecordMode>(currentMode);
  const [drafts, setDrafts] = useState(() => buildRecordFieldDrafts(fields));
  const [splitCount, setSplitCount] = useState(false);

  const handleSave = () => {
    getActiveProfile().setMode(
      mode,
      mode === 'custom' ? parseRecordFieldDrafts(drafts) : undefined
    );
    useProfileSessionStore.getState().setFilterConditions([]);
    onClose();
  };

  return (
    <FullScreenModal isOpen title={t('dialog.profile-mode.title')} onClose={onClose}>
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
                  (mode === currentMode ? ` (${t('dialog.profile-mode.current-tag')})` : ''),
              }))}
              value={mode}
              onChange={setMode}
            />
            {currentMode === 'count' && mode === 'standard' && (
              <p className="text-xs text-red-600">
                {t('dialog.profile-mode.count-to-standard-warn')}
              </p>
            )}
            {currentMode === 'count' && mode === 'custom' && (
              <label
                className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border
                  border-gray-200 p-3 transition-colors hover:bg-gray-50
                  has-[:checked]:border-blue-200 has-[:checked]:bg-blue-50
                  has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
              >
                <input
                  type="checkbox"
                  checked={splitCount}
                  disabled={!splitCount && drafts.length >= RECORD_FIELDS_MAX}
                  onChange={event => {
                    setSplitCount(event.target.checked);
                    setDrafts(current => splitCountModeFields(current, event.target.checked));
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 border-gray-300 accent-blue-600
                    focus:ring-blue-500"
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-700">
                    {t('dialog.profile-mode.split-count.label')}
                  </span>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t('dialog.profile-mode.split-count.description')}
                  </p>
                </div>
              </label>
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
