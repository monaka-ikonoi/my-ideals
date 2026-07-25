/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_GIT_BRANCH: string;
  readonly VITE_GIT_HASH: string;
  readonly VITE_LONG_VERSION: string;
  readonly VITE_BUILD_TIME: string;

  readonly VITE_DEBUG: string;
  readonly VITE_DEBUG_CATEGORIES: string;

  readonly VITE_STORAGE_BACKEND: string;

  readonly VITE_PREDEFINED_TEMPLATES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
