import { setStorageBackend } from './storage/runtime';
import { useSettingsStore } from './stores/settingsStore';
import { useProfileListStore } from './stores/profileListStore';
import { useActiveProfileStore } from './stores/activeProfileStore';
import { migrateProfileStorage } from './storage/migrate';
import { debugLog } from './utils/debug';

export async function bootstrap() {
  let currentBackend = useSettingsStore.getState().storageBackend;
  const expectedBackend = 'localStorage';

  debugLog.store.log(`Current storage backend: ${currentBackend}`);

  if (currentBackend != expectedBackend) {
    await migrateProfileStorage(currentBackend, expectedBackend);
    useSettingsStore.getState().setStorageBackend(expectedBackend);
    currentBackend = expectedBackend;
  }
  setStorageBackend(currentBackend);

  useProfileListStore.subscribe(
    state => state.activeId,
    activeId => {
      if (activeId) {
        void useActiveProfileStore.getState().load(activeId);
      } else {
        void useActiveProfileStore.getState().clear();
      }
    },
    { fireImmediately: true }
  );
}
