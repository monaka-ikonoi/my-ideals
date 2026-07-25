import { useEffect, useState } from 'react';
import { debugLog } from '@/utils/debug';

// Not yet part of TS lib.dom.d.ts - see https://developer.mozilla.org/docs/Web/API/BeforeInstallPromptEvent
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      debugLog.network.log('App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    // Keep the deferred event (and thus canInstall/the banner) around while the native prompt is
    // shown - clearing it immediately would hide the banner out from under an still-open prompt.
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    debugLog.network.log(`Install prompt outcome: ${outcome}`);

    // A BeforeInstallPromptEvent can only be used once - drop it now that the user has responded.
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt, promptInstall };
}
