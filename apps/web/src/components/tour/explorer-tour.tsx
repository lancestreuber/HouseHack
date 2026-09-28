import { useEffect, useSyncExternalStore } from "react";
import { Joyride, type EventData, STATUS, type Step } from "react-joyride";

// A guided tour of the explorer. It starts by itself the first time this
// browser opens the explorer; the header's "Launch tour" button replays it.

const SEEN_KEY = "yinzone-explorer-tour-seen";

// `launch` counts starts, so a replay remounts the tour at step one.
let state = { running: false, launch: 0 };
const listeners = new Set<() => void>();
const setState = (next: typeof state) => {
  state = next;
  for (const listener of listeners) listener();
};
const setRunning = (running: boolean) => setState({ ...state, running });
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Starts (or restarts) the tour; the explorer picks it up when it mounts. */
export const startTour = () => setState({ running: true, launch: state.launch + 1 });

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Storage blocked: don't pop the tour up on every visit.
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage blocked: nothing to remember it in.
  }
}

const SERVER_STATE = { running: false, launch: 0 };

const STEPS: Step[] = [
  {
    target: '[data-tour="search"]',
    title: "Find a parcel",
    content: "Search any Pittsburgh address or parcel PIN.",
    placement: "bottom",
  },
  {
    target: '[data-tour="map"]',
    title: "The map",
    content: "Colors show each area's overall score. Click a parcel to score it.",
    placement: "center",
  },
  {
    target: '[data-tour="layers"]',
    title: "Layers",
    content: "Change what colors the map, or stack zoning, hazards, transit and equity layers.",
    placement: "bottom-start",
  },
  {
    target: '[data-tour="where-to-build"]',
    title: "Where to build",
    content: "See where a housing type fits, and what a rezoning would unlock.",
    placement: "bottom-start",
  },
  {
    target: '[data-tour="weights"]',
    title: "Adjust weights",
    content: "Scores weigh five pillars. The weights are value judgments, so set your own.",
    placement: "bottom",
  },
  {
    target: '[data-tour="parcel-bar"]',
    title: "Selected parcel",
    content: "Star a parcel to save it to your dashboard.",
    placement: "bottom",
  },
  {
    target: '[data-tour="scores"]',
    title: "Pillar compliance",
    content: "How the parcel scores on each pillar.",
    placement: "left",
  },
  {
    target: '[data-tour="typologies"]',
    title: "Housing types",
    content: "Each housing type ranked for this parcel, with what holds it back.",
    placement: "top",
  },
  {
    target: '[data-tour="alerts"]',
    title: "Alerts",
    content: "Deal-killers and warnings, with their sources.",
    placement: "left",
  },
  {
    target: '[data-tour="chat"]',
    title: "Parceltongue",
    content: "Ask about the parcel in plain language. It explains; it never sets a score.",
    placement: "left",
  },
  {
    target: '[data-tour="launch-tour"]',
    title: "That's it",
    content: "Replay this tour any time from here.",
    placement: "bottom-end",
  },
];

/** Mounted by the explorer page. */
export function ExplorerTour() {
  const { running, launch } = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);

  // First visit in this browser: start once the explorer has laid out.
  useEffect(() => {
    if (seen()) return;
    const timer = window.setTimeout(startTour, 800);
    return () => window.clearTimeout(timer);
  }, []);

  const onEvent = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      markSeen();
      setRunning(false);
    }
  };

  return (
    <Joyride
      key={launch}
      steps={STEPS}
      run={running}
      continuous
      scrollToFirstStep={false}
      onEvent={onEvent}
      locale={{ last: "Done", skip: "Skip tour" }}
      options={{
        buttons: ["back", "skip", "primary"],
        showProgress: true,
        skipBeacon: true,
        skipScroll: true,
        primaryColor: "var(--brass)",
        backgroundColor: "var(--popover)",
        textColor: "var(--popover-foreground)",
        arrowColor: "var(--popover)",
        overlayColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 60,
      }}
      styles={{
        tooltip: { borderRadius: 8, fontSize: 13, padding: 16 },
        tooltipTitle: { fontSize: 14, fontWeight: 600 },
        tooltipContent: { padding: "8px 0 0" },
        buttonPrimary: { color: "var(--primary-foreground)", borderRadius: 6, fontSize: 12 },
        buttonBack: { color: "var(--muted-foreground)", fontSize: 12 },
        buttonSkip: { color: "var(--muted-foreground)", fontSize: 12 },
      }}
    />
  );
}
