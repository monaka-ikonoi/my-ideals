import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CollectionPage } from '@/components/CollectionPage';
import { useProfileListStore } from './stores/profileListStore';

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
        {activeProfileId ? (
          <CollectionPage profileId={activeProfileId} />
        ) : (
          <div className="flex h-[calc(100vh-56px)] items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700">No Profile Selected</h2>
              <p className="mt-2 text-gray-500">Create or import a profile to get started</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
