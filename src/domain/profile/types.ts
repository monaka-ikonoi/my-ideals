export type Profile = {
  magic: 'my-ideals-profile';
  version: 1;
  id: string;
  name: string;
  templateId: string;
  templateLink: string;
  templateRevision: number;
  collections: Record<string, Record<string, boolean>>;
};
