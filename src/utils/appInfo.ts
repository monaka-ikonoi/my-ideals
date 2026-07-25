export const APP_NAME = import.meta.env.VITE_APP_NAME;

export const DEV_MODE = import.meta.env.VITE_DEBUG === 'true';
export const MODE = DEV_MODE ? 'development' : 'production';

export const LONG_VERSION = import.meta.env.VITE_LONG_VERSION;

export const BUILD_TIME_RAW = import.meta.env.VITE_BUILD_TIME;

export const BUILD_TIME_FORMATTED = new Date(BUILD_TIME_RAW).toLocaleString();
