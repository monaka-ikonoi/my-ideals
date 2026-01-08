import type { Profile } from '@/domain/profile';
import type { Template, TemplateCollection, TemplateCollectionItem } from '@/domain/template';

export type WorkingProfileMeta = Omit<Profile, 'collections'>;
export type WorkingTemplateMeta = Omit<Template, 'collections'>;

export type WorkingCollectionItem = TemplateCollectionItem & { status: boolean };

export type WorkingCollection = Omit<TemplateCollection, 'items'> & {
  items: WorkingCollectionItem[];
};

export type WorkingProfile = {
  profile: WorkingProfileMeta;
  template: WorkingTemplateMeta;
  collections: WorkingCollection[];
};
