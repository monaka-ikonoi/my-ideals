import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CollectionPage } from '@/components/CollectionPage';
import { useProfileListStore } from './stores/profileListStore';
import { LoadingPage } from './components/ui/LoadingPage';
import { EmptyPage } from './components/EmptyPage';

export default function App() {
  const initialize = useProfileListStore(state => state.initialize);
  const isInitialized = useProfileListStore(state => state.isInitialized);
  const activeProfileId = useProfileListStore(state => state.activeId);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>{activeProfileId ? <CollectionPage /> : <EmptyPage />}</main>
    </div>
  );
}
