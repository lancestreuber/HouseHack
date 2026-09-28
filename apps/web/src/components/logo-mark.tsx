import { cn } from "@HouseHack/ui/lib/utils";

// The Yinzone mark: the wordmark's "o" under a roof. Traced from the design
// file's glyph, which draws it upside down with a slight tilt, so it's turned
// back here (177.9°) about its centre.
export const LOGO_PATH =
  "M7.832,0C3.71,0 0.33,3.431 0.33,7.615C0.33,11.799 3.71,15.23 7.832,15.23C11.954,15.23 15.334,11.8 15.334,7.615C15.334,3.431 11.954,0 7.832,0ZM7.832,12.887C4.946,12.887 2.638,10.544 2.638,7.615C2.638,4.686 4.946,2.343 7.832,2.343C10.717,2.343 13.026,4.686 13.026,7.615C12.943,10.544 10.635,12.887 7.832,12.887ZM14.509,14.561L7.832,17.489L1.154,14.561L0,16.653L7.832,20L15.664,16.653L14.509,14.561Z";

/** Logo mark in the current text color. */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="-1 -1 17.664 22" className={cn("size-5", className)} fill="currentColor" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={LOGO_PATH} fillRule="evenodd" transform="rotate(177.91 7.832 10)" />
    </svg>
  );
}
