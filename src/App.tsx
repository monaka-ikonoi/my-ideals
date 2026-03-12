import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { useProfileListStore } from './stores/profileListStore';
import { useActiveProfileStore } from './stores/activeProfileStore';
import { LoadingPage } from './components/ui/LoadingPage';
import { GlobalDialogs } from './components/GlobalDialogs';
import { GlobalToaster } from './components/GlobalToaster';
import { MainContent } from './components/MainContent';
import { DEV_MODE } from './utils/appInfo';

export default function App() {
  const { t } = useTranslation();

  const isInitialized = useProfileListStore(state => state.isInitialized);

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('app.tagline')}`;
    if (DEV_MODE) document.title = `[DEV] ${document.title}`;
  }, [t]);

  useEffect(() => {
    (async () => {
      await useProfileListStore.getState().initialize();
    })();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      void useActiveProfileStore.getState().flush();
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
      <MainContent />
      <GlobalDialogs />
      <GlobalToaster />
    </div>
  );
}
