import { Popover, PopoverContent, PopoverTrigger } from "@HouseHack/ui/components/popover";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Compass, Scale } from "lucide-react";

import { AddressSearch, type AddressResult } from "../map/address-search";
import { dispatchAddressSelect } from "../map/address-select-store";
import { startTour } from "../tour/explorer-tour";
import { WeightsPanel } from "./engine-settings";

const HEADER_BUTTON =
  "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground";

/** Console header: the address/parcel search, the weights panel beside it, and the tour button. */
export function ShellHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // On the explorer the map flies to the result; elsewhere, open the explorer on that parcel.
  const selectAddress = (result: AddressResult) => {
    if (!dispatchAddressSelect(result) && result.pin) void navigate({ to: "/app", search: { pin: result.pin } });
  };
  // The tour walks the explorer, so open it there first.
  const launchTour = () => {
    startTour();
    if (pathname !== "/app") void navigate({ to: "/app" });
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur-xl">
      <div data-tour="search" className="w-full max-w-xl flex-1">
        <AddressSearch onSelect={selectAddress} className="w-full" />
      </div>
      <Popover>
        <PopoverTrigger data-tour="weights" className={HEADER_BUTTON}>
          <Scale className="size-4" />
          Adjust weights
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-72 text-xs">
          <WeightsPanel />
        </PopoverContent>
      </Popover>
      <button type="button" data-tour="launch-tour" onClick={launchTour} className={`${HEADER_BUTTON} ml-auto`}>
        <Compass className="size-4" />
        Launch tour
      </button>
    </header>
  );
}
