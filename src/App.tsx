import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CollectionPage } from '@/components/CollectionPage';
import { useProfileListStore } from './stores/profileListStore';
import { useActiveProfileStore } from './stores/activeProfileStore';
import { LoadingPage } from './components/ui/LoadingPage';
import { EmptyPage } from './components/EmptyPage';
import { GlobalDialogs } from './components/GlobalDialogs';

export default function App() {
  const isInitialized = useProfileListStore(state => state.isInitialized);
  const activeProfileId = useProfileListStore(state => state.activeId);

  useEffect(() => {
    useProfileListStore.getState().initialize();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      useActiveProfileStore.getState().flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (!isInitialized) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>{activeProfileId ? <CollectionPage /> : <EmptyPage />}</main>

      <GlobalDialogs />
    </div>
  );
}
