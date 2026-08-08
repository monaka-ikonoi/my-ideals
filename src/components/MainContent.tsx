import { useProfileSessionStore } from '@/stores/profileSessionStore';
import { useProfileListStore } from '@/stores/profileListStore';
import { ProfileErrorPage } from './ProfileErrorPage';
import { ProfilePage } from './ProfilePage';
import { ProfileDialogs } from './ProfileDialogs';
import { EmptyPage } from './EmptyPage';
import { LoadingPage } from './ui/LoadingPage';

export function MainContent() {
  const activeProfileId = useProfileListStore(state => state.activeId);
  const profileLoadState = useProfileSessionStore(state => state.loadState);

  if (!activeProfileId) {
    return <EmptyPage />;
  }

  if (profileLoadState.status === 'error') {
    return <ProfileErrorPage error={profileLoadState.error} profile={profileLoadState.profile} />;
  }

  if (profileLoadState.status !== 'success') {
    return <LoadingPage />;
  }

  return (
    <>
      <ProfileDialogs />
      <ProfilePage />
    </>
  );
}
