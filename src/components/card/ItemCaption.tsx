import { type ItemCardMode } from './types';

type ItemCaptionProps = {
  name: string;
  mode: ItemCardMode;
  children?: React.ReactNode;
};

export function ItemCaption({ name, mode, children }: ItemCaptionProps) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50
        text-white
        ${mode === 'export' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs'}`}
    >
      <span className="truncate">{name}</span>
      {children}
    </div>
  );
}
