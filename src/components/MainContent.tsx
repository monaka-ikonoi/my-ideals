import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { useProfileListStore } from '@/stores/profileListStore';
import { ProfileErrorPage } from './ProfileErrorPage';
import { ProfilePage } from './ProfilePage';
import { EmptyPage } from './EmptyPage';
import { LoadingPage } from './ui/LoadingPage';

export function MainContent() {
  const activeProfileId = useProfileListStore(state => state.activeId);
  const profileLoadState = useActiveProfileStore(state => state.loadState);

  if (!activeProfileId) {
    return <EmptyPage />;
  }

  if (profileLoadState.status === 'error') {
    return <ProfileErrorPage error={profileLoadState.error} />;
  }

  if (profileLoadState.status !== 'success') {
    return <LoadingPage />;
  }

  return <ProfilePage />;
}
