import type { BlockedApp } from "../types/blocking";

export interface NativeAppConfig {
  packageName: string;
  appName: string;
  surveillanceType: string;
  surveillanceValue: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Native applies startTime/endTime to every control type, so a window left
 * over from a scheduled setup must not travel with a hard, timer or click
 * block.
 */
export function toNativeAppConfigs(apps: BlockedApp[]): NativeAppConfig[] {
  return apps
    .filter((a) => a.enabled)
    .map((a) => {
      const config: NativeAppConfig = {
        packageName: a.packageName,
        appName: a.appName,
        surveillanceType: a.surveillance.type,
        surveillanceValue: a.surveillance.value,
      };
      if (a.surveillance.type === "time" && a.startTime && a.endTime) {
        config.startTime = a.startTime;
        config.endTime = a.endTime;
      }
      return config;
    });
}
