// Runnable check for services/scheduleWindow.ts.
// Run with: node scripts/check-schedule-window.js
const assert = require("node:assert");
const {
  isWithinSchedule,
  scheduleToggleNeedsFriction,
} = require("../services/scheduleWindow.ts");

const entry = (day, startTime, endTime, enabled = true) => ({
  id: `${day}-${startTime}`,
  day,
  startTime,
  endTime,
  enabled,
});
// Local-time constructor: (year, monthIndex, day, hours, minutes). 2026-03-02 is a Monday.
const at = (day, hours, minutes) => new Date(2026, 2, 1 + day, hours, minutes);

assert.strictEqual(
  isWithinSchedule([], at(1, 12, 0)),
  true,
  "no schedule means always on",
);
assert.strictEqual(
  isWithinSchedule([entry(1, "09:00", "21:00", false)], at(1, 12, 0)),
  true,
  "a disabled entry does not count",
);

const daytime = [entry(1, "09:00", "21:00")];
assert.strictEqual(
  isWithinSchedule(daytime, at(1, 10, 0)),
  true,
  "inside a daytime window",
);
assert.strictEqual(
  isWithinSchedule(daytime, at(1, 22, 0)),
  false,
  "after a daytime window",
);
assert.strictEqual(
  isWithinSchedule(daytime, at(2, 10, 0)),
  false,
  "same time, another day",
);

const overnight = [entry(1, "22:00", "06:00")];
assert.strictEqual(
  isWithinSchedule(overnight, at(1, 23, 0)),
  true,
  "overnight: the evening half",
);
assert.strictEqual(
  isWithinSchedule(overnight, at(2, 2, 0)),
  true,
  "overnight: the morning half is the next day",
);
assert.strictEqual(
  isWithinSchedule(overnight, at(1, 3, 0)),
  false,
  "overnight: not the morning of its own day",
);
assert.strictEqual(
  isWithinSchedule(overnight, at(2, 7, 0)),
  false,
  "overnight: over by the next morning",
);

const sundayNight = [entry(6, "22:00", "06:00")];
assert.strictEqual(
  isWithinSchedule(sundayNight, at(0, 2, 0)),
  true,
  "overnight wraps from Saturday into Sunday",
);

assert.strictEqual(
  scheduleToggleNeedsFriction([], 1),
  true,
  "enabling the first day narrows always-on protection",
);
assert.strictEqual(
  scheduleToggleNeedsFriction([entry(1, "09:00", "21:00")], 2),
  false,
  "enabling another day widens protection",
);
assert.strictEqual(
  scheduleToggleNeedsFriction([entry(1, "09:00", "21:00")], 1),
  false,
  "disabling the last day returns to always-on",
);
assert.strictEqual(
  scheduleToggleNeedsFriction(
    [entry(1, "09:00", "21:00"), entry(2, "09:00", "21:00")],
    1,
  ),
  true,
  "disabling a day while another stays narrows protection",
);
assert.strictEqual(
  scheduleToggleNeedsFriction(
    [entry(1, "09:00", "21:00", false), entry(2, "09:00", "21:00")],
    1,
  ),
  false,
  "re-enabling a disabled day while another is on widens protection",
);

console.log("schedule-window: all checks passed");
