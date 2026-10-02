export interface BlockingCategory {
  id: string;
  name: string;
  description: string;
  domains: string[];
  enabled: boolean;
}

export interface BlocklistSource {
  id: string;
  url: string;
  name: string;
  enabled: boolean;
  format: "domains" | "hosts" | "keywords";
  category?: "adult" | "hentai" | "ads";
  lastFetchedAt?: string;
}

export interface BlockingStats {
  blockedToday: number;
  totalBlocked: number;
  lastBlockedAt: string | null;
  cleanSince: string;
  daysClean: number;
}

export interface ProtectionStatus {
  vpn: boolean;
  accessibility: boolean;
  overlay: boolean;
  deviceAdmin: boolean;
  foregroundService: boolean;
}

export interface BlockedUrl {
  url: string;
  enabled: boolean;
}

export type ControlMode = "flexible" | "locked" | "hardcore";

/**
 * Get the stricter of two control modes.
 * Main gates the app globally, sub adds per-screen friction.
 */
export function getEffectiveMode(
  main: ControlMode,
  sub: ControlMode,
): ControlMode {
  const order: Record<ControlMode, number> = {
    flexible: 0,
    locked: 1,
    hardcore: 2,
  };
  return order[sub] >= order[main] ? sub : main;
}

/**
 * True when `pending` is a strictly stricter control mode than `current`
 * (flexible < locked < hardcore). Promotions tighten protection and are
 * allowed without friction; only weakening a mode requires friction.
 */
export function isModeUpgrade(
  current: ControlMode,
  pending: ControlMode,
): boolean {
  return pending !== current && getEffectiveMode(current, pending) === pending;
}

// A larger value of the same friction type is a stricter gate. A time window
// has no value to compare, and the types cannot be ranked against each other.
function tightens(base: SurveillanceConfig, next: SurveillanceConfig): boolean {
  return (
    next.type === base.type && next.type !== "time" && next.value > base.value
  );
}

export function getEffectiveSurveillance(
  mainMode: ControlMode,
  mainSurv: SurveillanceConfig,
  subMode: ControlMode,
  subSurv: SurveillanceConfig,
): SurveillanceConfig {
  if (isModeUpgrade(mainMode, subMode)) return subSurv;
  // On a tie the section may only tighten the global gate, so a section set
  // to the same mode cannot be used to get around the global one.
  if (
    subMode === mainMode &&
    subMode !== "flexible" &&
    tightens(mainSurv, subSurv)
  ) {
    return subSurv;
  }
  return mainSurv;
}

export interface ScheduleEntry {
  id: string;
  day: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  enabled: boolean;
}

export interface SurveillanceConfig {
  type: "timer" | "click" | "time" | "none";
  value: number; // seconds for timer, count for clicks
  startHour?: number; // 0-23 for 'time'
  endHour?: number; // 0-23 for 'time'
}

export interface BlockedApp {
  packageName: string;
  appName: string;
  enabled: boolean;
  controlMode: ControlMode | "individual"; // Can use main mode or individual override
  surveillance: SurveillanceConfig;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
}

export interface ControlSelection {
  mode: ControlMode;
  surveillance: SurveillanceConfig;
}

/**
 * The strictest of several controls, for actions that touch every section.
 * Pass the global control first: the first restricted gate is the floor, a
 * later one only tightens it with a larger value of the same type, and a
 * flexible control contributes nothing. Between different friction types
 * the earlier one stands, since they cannot be ranked.
 */
export function strictestControl(
  controls: ControlSelection[],
): ControlSelection {
  return controls.reduce((acc, c) => {
    if (c.mode === "flexible") return acc;
    if (acc.mode === "flexible") return c;
    return {
      mode: isModeUpgrade(acc.mode, c.mode) ? c.mode : acc.mode,
      surveillance: tightens(acc.surveillance, c.surveillance)
        ? c.surveillance
        : acc.surveillance,
    };
  });
}
