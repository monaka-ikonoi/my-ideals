import { type ProfileFlag } from './flags';
import { type RecordMode } from './record';

export type ProfileTemplateInfo = {
  id: string;
  link: string;
  revision: number;
};

export type ProfileCollection = Record<string, Record<string, boolean | number>>;

export type Profile = {
  magic: 'my-ideals-profile';
  version: 1 | 2;
  id: string;
  name: string;
  template: ProfileTemplateInfo;
  /** Unused since v2, kept as a home for future orthogonal switches. */
  flags?: ProfileFlag[];
  mode: RecordMode;
  selectedMembers: string[];
  collections: ProfileCollection;
  lastModified: number;
};

export type ProfileBundle = {
  magic: 'my-ideals-profile-bundle';
  version: 1;
  created: number;
  profiles: Profile[];
};
