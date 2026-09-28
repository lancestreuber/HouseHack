import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@HouseHack/ui/components/command";

import { isCityParcel, municipalityName } from "@/lib/city-scope";
import { client } from "@/utils/orpc";

export type AddressResult = { label: string; lng: number; lat: number; pin: string | null; municode: number | null };

/** Geocoded Allegheny County matches for `query`, City parcels first. */
export function useAddressSearch(query: string) {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
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
        .then((rows) => setResults([...rows].sort((x, y) => Number(isCityParcel(y.municode)) - Number(isCityParcel(x.municode)))))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);
  return { results, loading };
}

export function AddressSearch({ onSelect, className }: { onSelect: (result: AddressResult) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { results, loading } = useAddressSearch(query);

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


  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[13px] text-faint transition-colors hover:text-muted-foreground ${className ?? ""}`}
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Search address, parcel PIN, or district…</span>
        <kbd className="rounded border border-border bg-popover px-1.5 py-0.5 text-[11px] tnum">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search address" description="Search for an address in the City of Pittsburgh">
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
                {r.pin == null ? (
                  <span className="ml-auto text-[10px] text-muted-foreground">no parcel match</span>
                ) : (
                  !isCityParcel(r.municode) && (
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      outside the City{municipalityName(r.municode) ? ` (${municipalityName(r.municode)})` : ""}
                    </span>
                  )
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
