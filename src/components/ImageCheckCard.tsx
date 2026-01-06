type ImageCheckCardProps = {
  src: string;
  text: string;
  checked: boolean;
  onChange: () => void;
};

export function ImageCheckCard({ src, text, checked, onChange }: ImageCheckCardProps) {
  return (
    <label className="relative block w-full cursor-pointer select-none">
      {/* Hidden controlling checkbox */}
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />

      {/* Image */}
      <img src={src} alt={text} className="aspect-[7/10] w-full rounded-md object-cover transition peer-not-checked:opacity-50"/>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50
                      px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs text-white rounded-b-md">
        <span className="truncate">{text}</span>
        {/* Visual checkbox (mirrors state) */}
        <input type="checkbox" checked={checked} readOnly className="pointer-events-none" />
      </div>
    </label>
  );
}

