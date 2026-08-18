import { useProfileSessionStore, useActiveProfile } from '@/stores/profileSessionStore';
import { useProfileListStore } from '@/stores/profileListStore';
import { TemplateContext } from '@/contexts/template';
import { ProfileErrorPage } from './ProfileErrorPage';
import { ProfilePage } from './ProfilePage';
import { ProfileDialogs } from './ProfileDialogs';
import { EmptyPage } from './EmptyPage';
import { LoadingPage } from './ui/LoadingPage';

function TemplateScope({ children }: { children: React.ReactNode }) {
  const template = useActiveProfile(state => state.template);
  return <TemplateContext value={template}>{children}</TemplateContext>;
}

export function MainContent() {
  const activeProfileId = useProfileListStore(state => state.activeId);
  const profileLoadState = useProfileSessionStore(state => state.loadState);

  if (!activeProfileId) {
    return <EmptyPage />;
  }

  if (profileLoadState.status === 'error' || profileLoadState.status === 'template-error') {
    return <ProfileErrorPage message={profileLoadState.message} />;
  }

  if (profileLoadState.status !== 'success') {
    return <LoadingPage />;
  }

  return (
    <TemplateScope>
      <ProfileDialogs />
      <ProfilePage />
    </TemplateScope>
  );
}
