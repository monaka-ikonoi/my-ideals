import { create, useStore } from 'zustand';
import { loadActiveProfile } from '@/services/loadActiveProfile';
import { type Template } from '@/domain/template';
import { debugLog } from '@/utils/debug';
import { type ProfileTemplateDiff } from '@/services/syncProfile';
import { createProfileStore, type ProfileState, type ProfileStore } from './profileStore';

export type ProfileLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'template-error'; message: string }
  | { status: 'error'; message: string };

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

    if (result.status === 'template-error') {
      set({
        loadState: { status: 'template-error', message: result.message },
        store: createProfileStore({ profile: result.profile, template: null }),
        changes: null,
        pendingSync: false,
      });
      return;
    }

    if (result.status === 'error') {
      set({
        loadState: { status: 'error', message: result.message },
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

type ReadyProfileState = ProfileState & { template: Template };

function requireReady(state: ProfileState | undefined): ReadyProfileState {
  if (!state || state.template === null) throw new Error('No profile is loaded');
  return state as ReadyProfileState;
}

export function useSessionProfile<T>(selector: (state: ProfileState) => T): T {
  const store = useProfileSessionStore(state => state.store);
  if (!store) throw new Error('No profile is loaded');
  return useStore(store, selector);
}

export function getSessionProfile(): ProfileState {
  const store = useProfileSessionStore.getState().store;
  if (!store) throw new Error('No profile is loaded');
  return store.getState();
}

export function useActiveProfile<T>(selector: (state: ReadyProfileState) => T): T {
  return useSessionProfile(state => selector(requireReady(state)));
}

export function getActiveProfile(): ReadyProfileState {
  return requireReady(useProfileSessionStore.getState().store?.getState());
}
