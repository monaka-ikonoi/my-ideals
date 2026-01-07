import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CollectionPage } from '@/components/CollectionPage';
import { useProfileListStore } from './stores/profileListStore';
import { EmptyPage } from './components/EmptyPage';

export default function App() {
  const initialize = useProfileListStore(state => state.initialize);
  const isInitialized = useProfileListStore(state => state.isInitialized);
  const activeProfileId = useProfileListStore(state => state.activeId);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <h1>Loading</h1>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>
        {activeProfileId ? <CollectionPage profileId={activeProfileId} /> : <EmptyPage />}
      </main>
    </div>
  );
}
