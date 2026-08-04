import { type Profile } from '@/domain/profile';
import { type Template } from '@/domain/template';
import { getProfileStorage } from '@/storage/ProfileStorage';
import { debugLog } from '@/utils/debug';
import {
  diffProfileWithTemplate,
  syncProfileWithTemplate,
  type ProfileTemplateDiff,
} from '@/utils/syncProfile';
import { fetchTemplate, formatTemplateError } from '@/utils/fetchTemplate';
import { applyTemplateMigrations } from '@/utils/templateMigration';

export type LoadActiveProfileError = { type: 'template' | 'profile'; message: string };

export type LoadActiveProfileResult =
  | {
      status: 'success';
      profile: Profile;
      template: Template;
      changes: ProfileTemplateDiff | null;
      pendingSync: boolean;
    }
  | { status: 'error'; error: LoadActiveProfileError; profile?: Profile };

function touch(profile: Profile) {
  profile.lastModified = Date.now();
}

export async function loadActiveProfile(profileId: string): Promise<LoadActiveProfileResult> {
  let profile = await getProfileStorage().getProfile(profileId);
  if (!profile) {
    debugLog.store.log(`Failed to load profile ${profileId}`);
    return {
      status: 'error',
      error: { type: 'profile', message: `Unable to load Profile ${profileId}` },
    };
  }

  const templateResult = await fetchTemplate(profile.template.link, profile.template.id);
  if (!templateResult.success) {
    debugLog.store.log(
      `Failed to load template for profile ${profileId}: ${formatTemplateError(templateResult.error)}`
    );
    return {
      status: 'error',
      error: { type: 'template', message: formatTemplateError(templateResult.error) },
      profile,
    };
  }
  if (profile.template.link !== templateResult.url) {
    debugLog.store.log(
      `Template link updated from ${profile.template.link} to ${templateResult.url}`
    );
    profile.template.link = templateResult.url;
    touch(profile);
    await getProfileStorage().setProfile(profile);
  }
  const template = templateResult.template;

  let changes: ProfileTemplateDiff | null = null;
  let pendingSync = false;
  if (profile.template.revision !== template.revision) {
    if (profile.template.revision !== 0) {
      applyTemplateMigrations(profile, template);
      changes = diffProfileWithTemplate(profile, template);
      pendingSync = changes.removed.length > 0;
    }
    if (!pendingSync) {
      profile = syncProfileWithTemplate(profile, template, false);
      touch(profile);
      await getProfileStorage().setProfile(profile);
    }
  }

  return { status: 'success', profile, template, changes, pendingSync };
}
