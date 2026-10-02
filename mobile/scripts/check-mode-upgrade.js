// Runnable check for isModeUpgrade in types/blocking.ts.
// Run with: node scripts/check-mode-upgrade.js
const assert = require("node:assert");
const {
  isModeUpgrade,
  getEffectiveSurveillance,
  strictestControl,
} = require("../types/blocking.ts");

// Promotions (tightening) are upgrades -> friction bypassed.
assert.strictEqual(
  isModeUpgrade("locked", "hardcore"),
  true,
  "locked->hardcore is an upgrade",
);
assert.strictEqual(
  isModeUpgrade("flexible", "locked"),
  true,
  "flexible->locked is an upgrade",
);
assert.strictEqual(
  isModeUpgrade("flexible", "hardcore"),
  true,
  "flexible->hardcore is an upgrade",
);

// Weakening / lateral are NOT upgrades -> friction still required.
assert.strictEqual(
  isModeUpgrade("hardcore", "locked"),
  false,
  "hardcore->locked weakens",
);
assert.strictEqual(
  isModeUpgrade("hardcore", "flexible"),
  false,
  "hardcore->flexible weakens",
);
assert.strictEqual(
  isModeUpgrade("locked", "flexible"),
  false,
  "locked->flexible weakens",
);
assert.strictEqual(
  isModeUpgrade("locked", "locked"),
  false,
  "same mode is not an upgrade",
);
assert.strictEqual(
  isModeUpgrade("hardcore", "hardcore"),
  false,
  "same mode is not an upgrade",
);

const strict = { type: "click", value: 999 };
const weak = { type: "timer", value: 5 };
const none = { type: "none", value: 0 };
assert.deepStrictEqual(
  getEffectiveSurveillance("hardcore", strict, "hardcore", weak),
  strict,
  "a tie keeps the global friction",
);
assert.deepStrictEqual(
  getEffectiveSurveillance("locked", strict, "hardcore", weak),
  weak,
  "a stricter section mode brings its own friction",
);
assert.deepStrictEqual(
  getEffectiveSurveillance("hardcore", strict, "locked", weak),
  strict,
  "a weaker section mode keeps the global friction",
);
assert.deepStrictEqual(
  getEffectiveSurveillance("flexible", none, "flexible", weak),
  none,
  "flexible on both sides has no friction",
);

const timer30 = { type: "timer", value: 30 };
const timer120 = { type: "timer", value: 120 };
assert.deepStrictEqual(
  getEffectiveSurveillance("locked", timer30, "locked", timer120),
  timer120,
  "a tie keeps a stronger section gate of the same type",
);
assert.deepStrictEqual(
  getEffectiveSurveillance("locked", timer120, "locked", timer30),
  timer120,
  "a tie drops a weaker section gate of the same type",
);
assert.deepStrictEqual(
  strictestControl([
    { mode: "flexible", surveillance: none },
    { mode: "hardcore", surveillance: weak },
    { mode: "locked", surveillance: strict },
  ]),
  { mode: "hardcore", surveillance: weak },
  "a hardcore section gates an app-wide action even when the global mode is flexible",
);
assert.deepStrictEqual(
  strictestControl([
    { mode: "flexible", surveillance: none },
    { mode: "flexible", surveillance: none },
  ]),
  { mode: "flexible", surveillance: none },
  "all flexible stays flexible",
);

const window9to21 = { type: "time", value: 30, startHour: 9, endHour: 21 };
const window2to3 = { type: "time", value: 120, startHour: 2, endHour: 3 };
assert.deepStrictEqual(
  getEffectiveSurveillance("locked", window9to21, "locked", window2to3),
  window9to21,
  "a tie between two time windows keeps the global one",
);
assert.deepStrictEqual(
  strictestControl([
    { mode: "locked", surveillance: timer120 },
    { mode: "hardcore", surveillance: weak },
  ]),
  { mode: "hardcore", surveillance: timer120 },
  "a stricter section mode cannot lower the gate on an app-wide action",
);
assert.deepStrictEqual(
  strictestControl([
    { mode: "locked", surveillance: timer30 },
    { mode: "locked", surveillance: timer120 },
  ]),
  { mode: "locked", surveillance: timer120 },
  "a larger value of the same type tightens an app-wide action",
);
assert.deepStrictEqual(
  strictestControl([
    { mode: "locked", surveillance: timer30 },
    { mode: "flexible", surveillance: timer120 },
  ]),
  { mode: "locked", surveillance: timer30 },
  "a flexible section contributes nothing",
);

console.log("mode-upgrade: all checks passed");
