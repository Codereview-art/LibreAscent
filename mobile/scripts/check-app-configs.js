// Runnable check for services/appConfigs.ts.
// Run with: node scripts/check-app-configs.js
const assert = require("node:assert");
const { toNativeAppConfigs } = require("../services/appConfigs.ts");

const app = (overrides) => ({
  packageName: "com.example.app",
  appName: "Example",
  enabled: true,
  controlMode: "individual",
  surveillance: { type: "none", value: 0 },
  ...overrides,
});

assert.deepStrictEqual(
  toNativeAppConfigs([app({ enabled: false })]),
  [],
  "disabled apps are not sent",
);
assert.deepStrictEqual(
  toNativeAppConfigs([app({ startTime: "03:00", endTime: "03:05" })]),
  [
    {
      packageName: "com.example.app",
      appName: "Example",
      surveillanceType: "none",
      surveillanceValue: 0,
    },
  ],
  "a leftover window never travels with a hard block",
);
assert.deepStrictEqual(
  toNativeAppConfigs([
    app({
      surveillance: { type: "timer", value: 60 },
      startTime: "09:00",
      endTime: "17:00",
    }),
  ]),
  [
    {
      packageName: "com.example.app",
      appName: "Example",
      surveillanceType: "timer",
      surveillanceValue: 60,
    },
  ],
  "nor with a timer bypass",
);
assert.deepStrictEqual(
  toNativeAppConfigs([
    app({
      surveillance: { type: "time", value: 0 },
      startTime: "09:00",
      endTime: "17:00",
    }),
  ]),
  [
    {
      packageName: "com.example.app",
      appName: "Example",
      surveillanceType: "time",
      surveillanceValue: 0,
      startTime: "09:00",
      endTime: "17:00",
    },
  ],
  "a scheduled app keeps its window",
);
assert.deepStrictEqual(
  toNativeAppConfigs([
    app({ surveillance: { type: "time", value: 0 }, startTime: "09:00" }),
  ]),
  [
    {
      packageName: "com.example.app",
      appName: "Example",
      surveillanceType: "time",
      surveillanceValue: 0,
    },
  ],
  "half a window is no window",
);

console.log("app-configs: all checks passed");
