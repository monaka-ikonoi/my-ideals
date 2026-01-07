import { useRef, useState, useCallback, type ReactNode } from 'react';
import { ZodError } from 'zod';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ProfileSchema, type Profile } from '@/domain/profile';
import { useProfileListStore } from '@/stores/profileListStore';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { InlineCode } from '@/components/ui/InlineCode';

type PendingImport = {
  profile: Profile;
  existingId: string;
};

type ProfileImportButtonProps = {
  children: ReactNode;
  className?: string;
};

export function ProfileImportButton({ children, className }: ProfileImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  const profiles = useProfileListStore(state => state.profiles);
  const importProfile = useProfileListStore(state => state.importProfile);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';

      if (!file) return;

      try {
        const profile = ProfileSchema.parse(JSON.parse(await file.text()));
        const exists = profiles.some(p => p.id === profile.id);

        if (exists) {
          setPendingImport({ profile, existingId: profile.id });
        } else {
          importProfile(profile, false);
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          setError(`Invalid JSON: ${e.message}`);
        } else if (e instanceof ZodError) {
          const errors = e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
          setError(`Invalid profile:\n${errors}`);
        } else {
          setError('Failed to read file');
        }
      }
    },
    [profiles, importProfile]
  );

  const handleConflict = useCallback(
    (action: 'overwrite' | 'duplicate' | 'cancel') => {
      if (!pendingImport) return;

      if (action !== 'cancel') {
        importProfile(pendingImport.profile, action === 'overwrite');
      }

      setPendingImport(null);
    },
    [pendingImport, importProfile]
  );

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Conflict Dialog */}
      {pendingImport && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => handleConflict('cancel')}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-semibold text-gray-900">Profile Already Exists</h2>
                <button
                  onClick={() => handleConflict('cancel')}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 py-4 text-gray-600">
                A profile named "<strong>{pendingImport.profile.name}</strong>" with ID{' '}
                <InlineCode>{pendingImport.profile.id}</InlineCode> already exists.
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
                <button
                  onClick={() => handleConflict('cancel')}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700
                    hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConflict('overwrite')}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white
                    hover:bg-red-700"
                >
                  Overwrite
                </button>
                <button
                  onClick={() => handleConflict('duplicate')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                    hover:bg-blue-700"
                >
                  Create Copy
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ErrorDialog
        isOpen={error !== null}
        title="Import Failed"
        message="Could not import the selected file."
        details={error ?? undefined}
        onClose={() => setError(null)}
      />
    </>
  );
}
