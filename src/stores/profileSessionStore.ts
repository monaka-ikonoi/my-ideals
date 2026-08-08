import { create, useStore } from 'zustand';
import { type Profile } from '@/domain/profile';
import { loadActiveProfile, type LoadActiveProfileError } from '@/services/activeProfileLoader';
import { debugLog } from '@/utils/debug';
import { type ProfileTemplateDiff } from '@/utils/syncProfile';
import { createProfileStore, type ProfileState, type ProfileStore } from './profileStore';

export type ProfileLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; error: LoadActiveProfileError; profile: Profile | null };

type ProfileSessionState = {
  loadState: ProfileLoadState;
  store: ProfileStore | null;
  changes: ProfileTemplateDiff | null;
  pendingSync: boolean;

  load: (profileId: string) => Promise<void>;
  clear: () => Promise<void>;
  flush: () => Promise<void>;
  confirmSyncChanges: (cleanup: boolean) => Promise<void>;
};

export const useProfileSessionStore = create<ProfileSessionState>()((set, get) => ({
  loadState: { status: 'idle' },
  store: null,
  changes: null,
  pendingSync: false,

  load: async (profileId: string) => {
    const previous = get().store;
    set({ loadState: { status: 'loading' } });
    await previous?.getState().flush();

    const result = await loadActiveProfile(profileId);

    if (result.status === 'error') {
      set({
        loadState: { status: 'error', error: result.error, profile: result.profile ?? null },
        store: null,
        changes: null,
        pendingSync: false,
      });
      return;
    }

    set({
      loadState: { status: 'success' },
      store: createProfileStore(result),
      changes: result.changes,
      pendingSync: result.pendingSync,
    });
    debugLog.store.log(`Loaded profile ${result.profile.name}, ${profileId}`);
  },

  clear: async () => {
    const previous = get().store;
    set({ loadState: { status: 'loading' } });
    await previous?.getState().flush();

    set({
      loadState: { status: 'idle' },
      store: null,
      changes: null,
      pendingSync: false,
    });
  },

  flush: async () => {
    await get().store?.getState().flush();
  },

  confirmSyncChanges: async (cleanup: boolean) => {
    const { store, pendingSync } = get();
    if (pendingSync) await store?.getState().syncWithTemplate(cleanup);

    set({ changes: null, pendingSync: false });
  },
}));

function requireStore(store: ProfileStore | null): ProfileStore {
  if (!store) throw new Error('No profile is loaded');
  return store;
}

export function useActiveProfile<T>(selector: (state: ProfileState) => T): T {
  const store = useProfileSessionStore(state => state.store);
  return useStore(requireStore(store), selector);
}

export function getActiveProfile(): ProfileState {
  return requireStore(useProfileSessionStore.getState().store).getState();
}

export function getActiveProfileOrNull(): ProfileState | null {
  return useProfileSessionStore.getState().store?.getState() ?? null;
}

export function getSessionProfile(): Profile | null {
  const { store, loadState } = useProfileSessionStore.getState();
  if (store) return store.getState().profile;
  return loadState.status === 'error' ? loadState.profile : null;
}
