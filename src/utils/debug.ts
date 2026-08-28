const ALL_CATEGORIES = ['render', 'store', 'perf', 'network', 'sync', 'storage', 'schema'] as const;
type LogCategory = (typeof ALL_CATEGORIES)[number];

function getEnabledCategories(): Set<LogCategory> {
  const debugEnabled = import.meta.env.VITE_DEBUG === 'true';
  if (!debugEnabled) return new Set();

  const categoriesStr: string = import.meta.env.VITE_DEBUG_CATEGORIES ?? '';
  if (!categoriesStr) return new Set();

  if (categoriesStr.trim().toLowerCase() === 'all') {
    return new Set(ALL_CATEGORIES);
  }

  const categories = categoriesStr
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean) as LogCategory[];

  return new Set(categories);
}

const enabledCategories = getEnabledCategories();
const isDebugEnabled = import.meta.env.VITE_DEBUG === 'true';

const PREFIX = '[DEBUG]';

function createLogger(category: LogCategory) {
  const categoryPrefix = `${PREFIX}[${category.toUpperCase()}]`;
  const enabled = enabledCategories.has(category);

  if (!enabled) {
    return {
      log: () => {},
      warn: () => {},
      error: () => {},
      time: () => {},
      timeEnd: () => {},
    };
  }

  return {
    log: (...args: unknown[]) => console.log(categoryPrefix, ...args),
    warn: (...args: unknown[]) => console.warn(categoryPrefix, ...args),
    error: (...args: unknown[]) => console.error(categoryPrefix, ...args),
    time: (label: string) => console.time(`${categoryPrefix} ${label}`),
    timeEnd: (label: string) => console.timeEnd(`${categoryPrefix} ${label}`),
  };
}

export const debugLog = {
  render: createLogger('render'),
  store: createLogger('store'),
  perf: createLogger('perf'),
  network: createLogger('network'),
  sync: createLogger('sync'),
  storage: createLogger('storage'),
  schema: createLogger('schema'),

  log: isDebugEnabled ? (...args: unknown[]) => console.log(PREFIX, ...args) : () => {},
  warn: isDebugEnabled ? (...args: unknown[]) => console.warn(PREFIX, ...args) : () => {},
  error: isDebugEnabled ? (...args: unknown[]) => console.error(PREFIX, ...args) : () => {},
  time: isDebugEnabled ? (label: string) => console.time(`${PREFIX} ${label}`) : () => {},
  timeEnd: isDebugEnabled ? (label: string) => console.timeEnd(`${PREFIX} ${label}`) : () => {},

  get config() {
    return {
      enabled: isDebugEnabled,
      categories: Array.from(enabledCategories),
    };
  },
};
