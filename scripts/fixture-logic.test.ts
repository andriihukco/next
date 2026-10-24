/**
 * @file fixture-logic.test.ts
 * @description Logic tests for the developer fixture generator.
 * Run with `npm run test:fixtures`.
 */
import {
  advanceFixtureVehicles,
  createFixtureVehicles,
} from "../src/lib/dev-fixtures";
import {
  DEFAULT_FIXTURE_SETTINGS,
  settingsForScenario,
} from "../src/lib/dev-fixture-settings";
import { createHash, createHmac } from "node:crypto";
// @ts-expect-error: plain ESM server module without type declarations
import { verifyTelegramLogin } from "../server/auth-telegram.mjs";

const results: string[] = [];
const check = (label: string, passed: boolean): void => {
  results.push(`${passed ? "PASS" : "FAIL"} ${label}`);
};

const night = settingsForScenario("night", DEFAULT_FIXTURE_SETTINGS);
const nightVehicles = createFixtureVehicles({ ...night, vehicleCount: 40 });
check("night caps the fleet at 6", nightVehicles.length === 6);

const peak = settingsForScenario("peak", DEFAULT_FIXTURE_SETTINGS);
check("peak default fleet is 120", peak.vehicleCount === 120);
check(
  "peak can render 300 vehicles",
  createFixtureVehicles({ ...peak, vehicleCount: 300 }).length === 300,
);
check(
  "network loss empties the fleet",
  createFixtureVehicles({ ...peak, scenario: "network-loss" }).length === 0,
);
check(
  "no service empties the fleet",
  createFixtureVehicles({ ...peak, scenario: "no-service" }).length === 0,
);

const first = createFixtureVehicles(peak);
const second = createFixtureVehicles(peak);
check("seed is deterministic", JSON.stringify(first) === JSON.stringify(second));
check(
  "a different seed changes the fleet",
  JSON.stringify(first) !==
    JSON.stringify(createFixtureVehicles({ ...peak, seed: 43 })),
);

const moved = advanceFixtureVehicles(first, 30);
const travelled = Math.hypot(
  moved[0].lat - first[0].lat,
  moved[0].lng - first[0].lng,
);
check("vehicles advance along the route", travelled > 0);

// Telegram login: sign the payload the way Telegram does, then tamper with it.
const botToken = "123456:test-token";
const signTelegram = (data: Record<string, string | number>): string => {
  const checkString = Object.keys(data).sort().map((key) => `${key}=${data[key]}`).join("\n");
  return createHmac("sha256", createHash("sha256").update(botToken).digest()).update(checkString).digest("hex");
};
const now = 1_800_000_000;
const login = { id: 42, first_name: "Олена", username: "olena", auth_date: now - 30 };
const signed = { ...login, hash: signTelegram(login) };
check("telegram login with a valid signature passes", verifyTelegramLogin(signed, botToken, now));
check("telegram login with a changed id fails", !verifyTelegramLogin({ ...signed, id: 43 }, botToken, now));
check("telegram login signed by another bot fails", !verifyTelegramLogin(signed, "999:other", now));
check("telegram login older than 10 minutes fails", !verifyTelegramLogin(signed, botToken, now + 11 * 60));
check("telegram login without a hash fails", !verifyTelegramLogin(login, botToken, now));

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) {
  process.exitCode = 1;
}
