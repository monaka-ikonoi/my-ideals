import { useState, useEffect } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

export function ScrollToTop({ threshold = 300 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-6 bottom-6 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg
        transition-all duration-300 hover:bg-blue-700 hover:shadow-xl active:scale-95 ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      aria-label="Scroll to top"
    >
      <ArrowUpIcon className="h-5 w-5" />
    </button>
  );
}
