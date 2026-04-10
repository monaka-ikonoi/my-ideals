import { type ProfileFlag } from './flags';

export type ProfileTemplateInfo = {
  id: string;
  link: string;
  revision: number;
};

export type ProfileCollection = Record<string, Record<string, boolean | number>>;

export type Profile = {
  magic: 'my-ideals-profile';
  version: 1;
  id: string;
  name: string;
  template: ProfileTemplateInfo;
  flags?: ProfileFlag[];
  selectedMembers: string[];
  collections: ProfileCollection;
  lastModified: number;
};
