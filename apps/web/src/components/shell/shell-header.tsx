import { AddressSearch } from "../map/address-search";
import { dispatchAddressSelect } from "../map/address-select-store";

/** Console header: the address/parcel search, spanning the content column.
 * Weights live behind the rail gear, so the header carries search only. */
export function ShellHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-xl">
      <AddressSearch onSelect={dispatchAddressSelect} className="w-full max-w-xl flex-1" />
    </header>
  );
}
