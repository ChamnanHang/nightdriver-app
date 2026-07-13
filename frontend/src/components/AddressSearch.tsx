import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type GeoResult, searchAddress } from "../utils/geocode";

interface Props {
  placeholder: string;
  onSelect: (result: GeoResult) => void;
}

export default function AddressSearch({ placeholder, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    if (val.length < 3) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchAddress(val);
      setResults(res);
      setOpen(res.length > 0);
      setLoading(false);
    }, 500);
  };

  const pick = (r: GeoResult) => {
    setQuery(r.display_name);
    setOpen(false);
    onSelect(r);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30 animate-pulse">
            Searching…
          </span>
        )}
      </div>

      {open && (
        <ul className="absolute z-[9999] mt-1 w-full bg-night-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 line-clamp-2"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
