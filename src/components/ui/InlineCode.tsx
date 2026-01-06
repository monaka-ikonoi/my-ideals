import type { ReactNode } from 'react';

type InlineCodeProps = {
  children: ReactNode;
};

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code
      className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm whitespace-nowrap
        text-gray-800"
    >
      {children}
    </code>
  );
}
