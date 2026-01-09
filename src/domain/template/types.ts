import { type TemplateResourceBaseUrl } from './imageBaseUrl';

export type TemplateCollectionItem = {
  id: string;
  member: string;
  title: string;
  image?: string;
};

export type TemplateCollection = {
  id: string;
  name: string;
  items: TemplateCollectionItem[];
};

export type TemplateMember = {
  id: string;
  name: string;
};

export type Template = {
  magic: 'my-ideals-template';
  version: 1;
  revision: number;
  id: string;
  name: string;
  description?: string;
  author?: string;
  imageResourceType: 'inline' | 'baseUrl';
  imageBaseUrl?: TemplateResourceBaseUrl;
  members: TemplateMember[];
  collections: TemplateCollection[];
};
