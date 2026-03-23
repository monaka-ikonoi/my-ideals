import { toast } from 'sonner';
import { setStorageBackend } from './storage/runtime';
import { useSettingsStore } from './stores/settingsStore';
import { useProfileListStore } from './stores/profileListStore';
import { useActiveProfileStore } from './stores/activeProfileStore';

export function bootstrap() {
  const storageBackend = useSettingsStore.getState().storageBackend;
  toast.info(`Storage backend: ${storageBackend}`);
  setStorageBackend(storageBackend);

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
