import { setStorageBackend } from './storage/runtime';
import { useSettingsStore } from './stores/settingsStore';
import { useProfileListStore } from './stores/profileListStore';
import { useProfileSessionStore } from './stores/profileSessionStore';
import { migrateProfileStorage } from './storage/migrate';
import { debugLog } from './utils/debug';
import { getConfiguredStorageBackend } from './storage/config';

/*
 * Ask the browser to mark our storage as persistent so it won't be evicted
 * under storage pressure or by Safari's ITP 7-day rule.
 */
async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist) return;
    const alreadyPersisted = (await navigator.storage.persisted?.()) ?? false;
    if (alreadyPersisted) {
      debugLog.storage.log('Persistent storage already granted');
      return;
    }
    const granted = await navigator.storage.persist();
    debugLog.storage.log(`Persistent storage request: ${granted ? 'granted' : 'denied'}`);
  } catch (e) {
    debugLog.storage.log('Persistent storage request failed', e);
  }
}

export async function bootstrap() {
  void requestPersistentStorage();

  let currentBackend = useSettingsStore.getState().storageBackend;
  const configuredBackend = getConfiguredStorageBackend();

  debugLog.storage.log(`Current storage backend: ${currentBackend}`);

  if (currentBackend != configuredBackend) {
    await migrateProfileStorage(currentBackend, configuredBackend);
    useSettingsStore.getState().setStorageBackend(configuredBackend);
    currentBackend = configuredBackend;
  }
  setStorageBackend(currentBackend);

  await useProfileListStore.getState().initialize();

  useProfileListStore.subscribe(
    state => state.activeId,
    activeId => {
      if (activeId) {
        void useProfileSessionStore.getState().load(activeId);
      } else {
        void useProfileSessionStore.getState().clear();
      }
    },
    { fireImmediately: true }
  );
}
