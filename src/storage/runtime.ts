export type StorageBackend = 'localStorage' | 'indexedDb';

let currentStorageBackend: StorageBackend = 'localStorage';

export const getStorageBackend = (): StorageBackend => currentStorageBackend;

export const setStorageBackend = (backend: StorageBackend) => {
  currentStorageBackend = backend;
};
