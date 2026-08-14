import { debugLog } from '@/utils/debug';
import { getProfileStorage } from './ProfileStorage';
import type { StorageBackend } from './runtime';

export type MigrateProfileStorageResult = {
  success: number;
  failed: number;
};

export async function migrateProfileStorage(
  from: StorageBackend,
  to: StorageBackend,
  cleanup: boolean = false
): Promise<void> {
  if (from === to) return;

  debugLog.store.log(`Migrating storage from ${from} to ${to}`);
  debugLog.perf.time('Migrate storage');

  const source = getProfileStorage(from);
  const target = getProfileStorage(to);

  for (const id of await source.listProfiles()) {
    const result = await source.getProfile(id);
    if (!result.success) {
      debugLog.store.error(`Failed to migrate ${id} from ${from} to ${to}: ${result.message}`);
      continue;
    }

    await target.setProfile(result.profile);
    if (cleanup) await source.deleteProfile(id);
  }

  debugLog.perf.timeEnd('Migrate storage');
  return;
}
