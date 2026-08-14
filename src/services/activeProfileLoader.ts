import { type Profile } from '@/domain/profile';
import { type Template } from '@/domain/template';
import { getProfileStorage } from '@/storage/ProfileStorage';
import { debugLog } from '@/utils/debug';
import {
  diffProfileWithTemplate,
  syncProfileWithTemplate,
  type ProfileTemplateDiff,
} from '@/services/syncProfile';
import { fetchTemplate, formatTemplateError } from '@/utils/fetchTemplate';
import { applyTemplateMigrations } from '@/utils/templateMigration';

export type LoadActiveProfileResult =
  | {
      status: 'success';
      profile: Profile;
      template: Template;
      changes: ProfileTemplateDiff | null;
      pendingSync: boolean;
    }
  | { status: 'template-error'; profile: Profile; message: string }
  | { status: 'error'; message: string };

function touch(profile: Profile) {
  profile.lastModified = Date.now();
}

export async function loadActiveProfile(profileId: string): Promise<LoadActiveProfileResult> {
  const profileResult = await getProfileStorage().getProfile(profileId);
  if (!profileResult.success) {
    debugLog.store.log(`Failed to load profile ${profileId}`);
    return {
      status: 'error',
      message: `Unable to load Profile ${profileId}\n${profileResult.message}`,
    };
  }
  let profile = profileResult.profile;

  const templateResult = await fetchTemplate(profile.template.link, profile.template.id);
  if (!templateResult.success) {
    debugLog.store.log(
      `Failed to load template for profile ${profileId}: ${formatTemplateError(templateResult.error)}`
    );
    return {
      status: 'template-error',
      profile,
      message: formatTemplateError(templateResult.error),
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
