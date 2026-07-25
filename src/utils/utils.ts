export const normalizeStatusBoolean = (status: boolean | number | null | undefined): boolean =>
  typeof status === 'boolean' ? status : (status ?? 0) > 0;

export const normalizeStatusNumber = (status: boolean | number | null | undefined): number =>
  typeof status === 'boolean' ? (status ? 1 : 0) : (status ?? 0);

export const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
};
