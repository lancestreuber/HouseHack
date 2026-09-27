import { GlassSurface } from "@HouseHack/ui/components/glass";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@HouseHack/ui/components/command";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { client } from "@/utils/orpc";

export type AddressResult = { label: string; lng: number; lat: number; pin: string | null };

export function AddressSearch({ onSelect }: { onSelect: (result: AddressResult) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Cmd/Ctrl+K opens the palette from anywhere on the page.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Debounced so we don't hammer Nominatim's free (rate-limited) geocoder on
  // every keystroke.
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      void client.parcels
        .searchAddress({ query })
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <>
      <GlassSurface edge="none" className="pointer-events-auto rounded-full">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Search className="size-3.5" />
          Search address
          <kbd className="ml-1 rounded border border-glass-border bg-glass-card px-1 text-[10px]">⌘K</kbd>
        </button>
      </GlassSurface>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search address"
        description="Search for an address in Allegheny County"
        className="bg-pane/90 backdrop-blur-glass"
      >
        <CommandInput placeholder="Search an address…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{loading ? "Searching…" : query.trim().length < 3 ? "Type at least 3 characters." : "No results."}</CommandEmpty>
          <CommandGroup heading="Addresses">
            {results.map((r, i) => (
              <CommandItem
                key={i}
                value={`${r.label}-${i}`}
                onSelect={() => {
                  onSelect(r);
                  setOpen(false);
                }}
              >
                {r.label}
                {r.pin == null && (
                  <span className="ml-auto text-[10px] text-muted-foreground">no parcel match</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}