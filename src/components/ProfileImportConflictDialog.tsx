import { ConfirmDialog } from './ui/ConfirmDialog';
import { InlineCode } from './ui/InlineCode';

export type ImportConflictAction = 'overwrite' | 'duplicate' | 'cancel';

type ImportConflictDialogProps = {
  isOpen: boolean;
  profileName: string;
  profileId: string;
  onAction: (action: ImportConflictAction) => void;
};

export function ImportConflictDialog({
  isOpen,
  profileName,
  profileId,
  onAction,
}: ImportConflictDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Profile Already Exists"
      message={
        <>
          A profile named "<strong>{profileName}</strong>" with ID{' '}
          <InlineCode>{profileId}</InlineCode> already exists. What would you like to do?
        </>
      }
      options={[
        {
          label: 'Create Copy',
          value: 'duplicate',
          variant: 'primary',
        },
        {
          label: 'Overwrite',
          value: 'overwrite',
          variant: 'danger',
        },
      ]}
      onSelect={value => onAction(value as ImportConflictAction)}
      onCancel={() => onAction('cancel')}
    />
  );
}
