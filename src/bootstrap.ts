import { setStorageBackend } from './storage/runtime';
import { useSettingsStore } from './stores/settingsStore';
import { useProfileListStore } from './stores/profileListStore';
import { useActiveProfileStore } from './stores/activeProfileStore';
import { migrateProfileStorage } from './storage/migrate';
import { debugLog } from './utils/debug';
import { getConfiguredStorageBackend } from './storage/config';

export async function bootstrap() {
  let currentBackend = useSettingsStore.getState().storageBackend;
  const configuredBackend = getConfiguredStorageBackend();

  debugLog.store.log(`Current storage backend: ${currentBackend}`);

  if (currentBackend != configuredBackend) {
    await migrateProfileStorage(currentBackend, configuredBackend);
    useSettingsStore.getState().setStorageBackend(configuredBackend);
    currentBackend = configuredBackend;
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
