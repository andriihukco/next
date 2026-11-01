/**
 * @file server-logic.test.mjs
 * @description Logic tests for the pure server helpers: map matching, next-stop
 * projection, GTFS parsing and the air alert report parser.
 * Run with `npm run test:server`.
 */
import { cumulativeShapeLengths, mapMatchPoint, projectOntoShape } from "../server/lib/geo.mjs";
import { normalizeRoute, parseCsv } from "../server/lib/gtfs-parse.mjs";
import { parseLvivAirAlert } from "../server/lib/air-alert-parse.mjs";

const results = [];
const check = (label, passed) => {
  results.push(`${passed ? "PASS" : "FAIL"} ${label}`);
};

// A straight east-west street in Lviv, about 0.73 km long.
const street = [
  [49.84, 24.02],
  [49.84, 24.03],
];

const near = mapMatchPoint(49.8403, 24.025, street);
check("a GPS point 33 m off the street snaps onto it", near.matched && near.lat === 49.84);
const far = mapMatchPoint(49.845, 24.025, street);
check("a GPS point 550 m away is left as it is", !far.matched && far.lat === 49.845);
check("a shape with one point never matches", !mapMatchPoint(49.84, 24.02, [[49.84, 24.02]]).matched);

const cumulative = cumulativeShapeLengths(street);
check("shape length uses the planar Lviv scale", Math.abs(cumulative[1] - 0.73) < 1e-9);
const middle = projectOntoShape(49.84, 24.025, street, cumulative);
check("projection finds the arc in the middle of the street", Math.abs(middle.arc - 0.365) < 1e-9);
check("projection reports zero distance on the street", middle.distance < 1e-9);

const trolleybus = normalizeRoute("Тр05", "Сихів - Центр", "800");
check("«Тр05» is trolleybus 5", trolleybus.type === "trolleybus" && trolleybus.route === "5");
const tram = normalizeRoute("Т8а", "", "0");
check("«Т8а» is tram 8A", tram.type === "tram" && tram.route === "8A");
check("bus 47 is named 47A as on eWay", normalizeRoute("А47", "", "3").route === "47A");

const rows = parseCsv('stop_id,stop_name\r\n1,"Площа Ринок, південь"\n2,"Вокзал ""Головний"""\n');
check("CSV keeps commas inside quotes", rows[0].stop_name === "Площа Ринок, південь");
check("CSV unescapes doubled quotes", rows[1].stop_name === 'Вокзал "Головний"');

const report = (lvivBlock) => `Report time: Europe/Kyiv, 2026-11-01T15:00:00

## 3. Active alerts

**Київська область** [red] since 10:00

${lvivBlock}

## 4. Threats

- **14:40 — Shahed** over Lviv district (Львівський район) — moving west
`;

const active = parseLvivAirAlert(report("**Львівська область** [red] since 14:45, areas affected: (Львів) (Стрий)"));
check("an alert in the Lviv block is active", active.status === "active" && active.level === "red");
check("today's start time reads «з 14:45»", active.sinceText === "з 14:45");
check("affected areas are listed", active.areasAffected.join(",") === "Львів,Стрий");
check("a drone threat over Lviv is kept", active.threats.length === 1 && active.threats[0].kind === "drone");

const clear = parseLvivAirAlert(report("**Волинська область** [yellow] since 12:00"));
check("no Lviv block means clear", clear.status === "clear" && clear.level === null);
check("the report time is kept", clear.reportAt === "2026-11-01T15:00:00+03:00");

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exit(1);
