import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { useProfileSessionStore } from './stores/profileSessionStore';
import { GlobalDialogs } from './components/GlobalDialogs';
import { GlobalToaster } from './components/GlobalToaster';
import { MainContent } from './components/MainContent';
import { DEV_MODE } from './utils/appInfo';

export default function App() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('app.tagline')}`;
    if (DEV_MODE) document.title = `[DEV] ${document.title}`;
  }, [t]);

  useEffect(() => {
    const flushSafely = () => {
      void useProfileSessionStore.getState().flush();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSafely();
    };

    window.addEventListener('beforeunload', flushSafely);
    window.addEventListener('pagehide', flushSafely);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', flushSafely);
      window.removeEventListener('pagehide', flushSafely);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MainContent />
      <GlobalDialogs />
      <GlobalToaster />
    </div>
  );
}
