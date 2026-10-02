import type { ScheduleEntry } from "../types/blocking";

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * True when `now` falls inside an enabled window. No enabled window means
 * protection is always on. A window whose end is before its start runs
 * overnight: it starts on its own day and ends on the next.
 */
export function isWithinSchedule(
  schedule: ScheduleEntry[],
  now: Date,
): boolean {
  const active = schedule.filter((s) => s.enabled);
  if (active.length === 0) return true;
  const day = now.getDay();
  const yesterday = (day + 6) % 7;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return active.some((s) => {
    const start = minutesOf(s.startTime);
    const end = minutesOf(s.endTime);
    if (start <= end)
      return s.day === day && minutes >= start && minutes <= end;
    return (
      (s.day === day && minutes >= start) ||
      (s.day === yesterday && minutes <= end)
    );
  });
}

/**
 * Toggling a day needs friction only when it shrinks the protected time:
 * enabling the first day (always-on becomes one window) or disabling a day
 * while others stay on.
 */
export function scheduleToggleNeedsFriction(
  schedule: ScheduleEntry[],
  dayIndex: number,
): boolean {
  const enabledDays = schedule.filter((s) => s.enabled).map((s) => s.day);
  const isEnabled = enabledDays.includes(dayIndex);
  return isEnabled ? enabledDays.length > 1 : enabledDays.length === 0;
}
