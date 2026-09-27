// Bridges the navbar's address search (mounted globally in Header) to the
// map (mounted only on the home route): the map registers a handler while
// it's alive, and the navbar dispatches into whatever is currently registered.
import type { AddressResult } from "./address-search";

let handler: ((result: AddressResult) => void) | null = null;

export function setAddressSelectHandler(next: typeof handler) {
  handler = next;
}

export function dispatchAddressSelect(result: AddressResult) {
  handler?.(result);
}
