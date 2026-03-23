import { z } from 'zod';
import { type StorageBackend } from './runtime';

const StorageBackendSchema = z.enum(['localStorage', 'indexedDb']);

export function getConfiguredStorageBackend(): StorageBackend {
  const parsed = StorageBackendSchema.safeParse(import.meta.env.VITE_STORAGE_BACKEND);
  return parsed.success ? parsed.data : 'localStorage';
}
