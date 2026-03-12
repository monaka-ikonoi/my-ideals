import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/solid';

function useIsMobile() {
  const mediaQuery = window.matchMedia('(max-width: 1023px)');

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return mediaQuery.matches;
  });

  useEffect(() => {
    const handleResize = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleResize);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [mediaQuery]);

  return isMobile;
}

export function GlobalToaster() {
  const isMobile = useIsMobile();

  return (
    <Toaster
      theme="system"
      position={isMobile ? 'top-center' : 'top-right'}
      expand={true}
      style={{
        top: '72px',
        right: '12px',
      }}
      icons={{
        success: <CheckCircleIcon />,
        warning: <ExclamationCircleIcon />,
        error: <XCircleIcon />,
        info: <InformationCircleIcon />,
      }}
      toastOptions={{
        duration: 3000,
        unstyled: true,
        classNames: {
          toast: 'flex items-start gap-3 rounded-lg border px-4 py-2 text-sm',
          title: 'font-medium text-current',
          success: 'bg-green-50 border-green-200 text-green-700',
          error: 'bg-red-50 border-red-200 text-red-700',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
          info: 'bg-blue-50 border-blue-200 text-blue-700',
          icon: 'h-5 w-5 shrink-0',
        },
      }}
    />
  );
}
