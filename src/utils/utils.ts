export const normalizeStatusBoolean = (status: boolean | number | null | undefined): boolean =>
  typeof status === 'boolean' ? status : (status ?? 0) > 0;

export const normalizeStatusNumber = (status: boolean | number | null | undefined): number =>
  typeof status === 'boolean' ? (status ? 1 : 0) : (status ?? 0);
