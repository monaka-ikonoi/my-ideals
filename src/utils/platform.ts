export const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari legacy flag (still present on home-screen-launched PWAs)
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
};

export const isIos = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) // iPadOS 13+ fakes its User-Agent as macOS
  );
};

export const isMacSafari = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
};
