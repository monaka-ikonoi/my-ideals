import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { useProfileListStore } from '@/stores/profileListStore';
import { ProfileErrorPage } from './ProfileErrorPage';
import { CollectionPage } from './CollectionPage';
import { EmptyPage } from './EmptyPage';
import { LoadingPage } from './ui/LoadingPage';

export function MainContent() {
  const activeProfileId = useProfileListStore(state => state.activeId);
  const profileLoaded = useActiveProfileStore(state => !!state.profile);
  const isLoading = useActiveProfileStore(state => state.isLoading);
  const error = useActiveProfileStore(state => state.error);

  if (!activeProfileId) {
    return <EmptyPage />;
  }

  if (error) {
    return <ProfileErrorPage />;
  }

  if (isLoading || !profileLoaded) {
    return <LoadingPage />;
  }

  return <CollectionPage />;
}
