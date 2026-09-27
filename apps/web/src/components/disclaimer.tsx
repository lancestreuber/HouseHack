// The decision-support disclaimer the hackathon requires on every tool.
// One wording, reused wherever results are shown.

export const DISCLAIMER =
  "Decision support only, not legal, financial or zoning advice. Zoning is a simplified reading of the City code; verify with the Zoning Administrator and a qualified professional before acting.";

export const LIMITATIONS_URL = "/resources#limitations";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[10px] leading-snug text-muted-foreground ${className}`}>
      {DISCLAIMER}{" "}
      <a href={LIMITATIONS_URL} className="underline underline-offset-2 hover:text-foreground">
        Limitations
      </a>
    </p>
  );
}
