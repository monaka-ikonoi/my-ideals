import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type CommonBackdropProps = {
  children: ReactNode;
};

export function CommonBackdrop({ children }: CommonBackdropProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/50" />
      {children}
    </>,
    document.body
  );
}
