type TemplateCollectionItem = {
  id: string;
  member: string;
  title: string;
};

type TemplateCollection = {
  id: string;
  name: string;
  items: TemplateCollectionItem[];
};

type TemplateMember = {
  id: string;
  name: string;
};

export type Template = {
  magic: 'my-ideals-template';
  version: 1;
  revision: number;
  id: string;
  name: string;
  members: TemplateMember[];
  collections: TemplateCollection[];
};
