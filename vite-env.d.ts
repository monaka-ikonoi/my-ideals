interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_GIT_BRANCH: string;
  readonly VITE_GIT_REVISION: string;
  readonly VITE_BUILD_TIME: string;

  readonly VITE_DEBUG: string;
  readonly VITE_DEBUG_CATEGORIES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
