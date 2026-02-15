import { type TemplateResourceBaseUrl } from './imageBaseUrl';

export type TemplateLayout = {
  aspectRatio?: [number, number];
  columns?: [number, number?, number?];
};

export type TemplateCollectionItem = {
  id: string;
  member: string | string[];
  name: string;
  image?: string;
  rotated?: boolean;
};

export type TemplateCollection = {
  id: string;
  name: string;
  layout?: TemplateLayout;
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
  link?: string;
  imageResourceType: 'inline' | 'baseUrl';
  imageBaseUrl?: TemplateResourceBaseUrl;
  layout?: TemplateLayout;
  members: TemplateMember[];
  collections: TemplateCollection[];
};
