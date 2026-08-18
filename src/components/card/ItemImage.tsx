import { useState } from 'react';

type ItemImageProps = {
  src: string;
  fallbackSrc?: string;
  alt: string;
  aspectRatio: string;
  dimmed: boolean;
  eager: boolean;
  children?: React.ReactNode;
};

export function ItemImage({
  src,
  fallbackSrc,
  alt,
  aspectRatio,
  dimmed,
  eager,
  children,
}: ItemImageProps) {
  const [status, setStatus] = useState<'loading' | 'fallback' | 'loaded' | 'failed'>('loading');
  const currentSrc = status === 'fallback' ? (fallbackSrc as string) : src;

  return (
    <div className="@container relative w-full shrink-0" style={{ aspectRatio }}>
      {/* Image placeholder: rendered underneath until the image successfully loads */}
      {status !== 'loaded' && (
        <div
          className={`absolute inset-0 flex h-full w-full items-center justify-center bg-gray-200
          p-2 text-center text-sm whitespace-pre-line text-gray-600 transition
          ${dimmed ? 'opacity-50' : ''}`}
        >
          {alt.split(' ').join('\n')}
        </div>
      )}

      {status !== 'failed' && (
        <img
          src={currentSrc}
          alt={alt}
          crossOrigin="anonymous"
          loading={eager ? 'eager' : 'lazy'}
          decoding={eager ? 'sync' : 'async'}
          onLoad={() => setStatus('loaded')}
          onError={() =>
            setStatus(prev => {
              if (prev === 'loading') return fallbackSrc ? 'fallback' : 'failed';
              if (prev === 'fallback') return 'failed';
              return prev;
            })
          }
          className={`absolute inset-0 h-full w-full object-cover transition
          ${dimmed ? 'opacity-50' : ''}`}
        />
      )}

      {children}
    </div>
  );
}
