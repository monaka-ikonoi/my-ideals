export const normalizeStatusBoolean = (status: boolean | number): boolean =>
  typeof status === 'boolean' ? status : status > 0;

export const normalizeStatusNumber = (status: boolean | number): number =>
  typeof status === 'boolean' ? (status ? 1 : 0) : status;
