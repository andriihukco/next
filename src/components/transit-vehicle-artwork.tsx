import { vehicleFleetColor, vehicleModelDescription } from "../lib/fleet";

type VehicleType = "tram" | "trolleybus" | "bus";

type TransitVehicleArtworkProps = {
  id: string;
  route: string;
  type: VehicleType;
};

type Shape = {
  x0: number; // rear
  x1: number; // front (right)
  wheels: number[];
  doors: number[];
  bellows?: number; // articulation joint (x)
  panto?: number; // pantograph (x)
  poles?: boolean; // trolley poles
};

const SHAPES: Record<VehicleType, Shape> = {
  bus: { x0: 28, x1: 292, wheels: [82, 238], doors: [132, 208] },
  trolleybus: { x0: 28, x1: 292, wheels: [82, 238], doors: [132, 208], poles: true },
  tram: { x0: 8, x1: 312, wheels: [44, 104, 216, 276], doors: [70, 232], bellows: 160, panto: 84 },
};

const GLASS = "#18394a";
const DARK = "#26323a";

export function TransitVehicleArtwork({ id, route, type }: TransitVehicleArtworkProps) {
  const paint = vehicleFleetColor(type);
  const label = `${vehicleModelDescription(type)}, маршрут ${route}, борт ${id}`;
  const { x0, x1, wheels, doors, bellows, panto, poles } = SHAPES[type] ?? SHAPES.bus;
  const w = x1 - x0;

  // side windows: evenly spaced, skipping doors and the tram joint
  const windows: number[] = [];
  for (let x = x0 + 10; x + 24 <= x1 - 32; x += 30) {
    const hitsDoor = doors.some((d) => x < d + 22 && x + 24 > d - 2);
    const hitsJoint = bellows !== undefined && x < bellows + 12 && x + 24 > bellows - 12;
    if (!hitsDoor && !hitsJoint) windows.push(x);
  }

  return (
    <svg className="transit-vehicle-artwork" viewBox="0 0 320 112" role="img" aria-label={label}>
      <ellipse cx={(x0 + x1) / 2} cy="94" rx={w / 2 - 6} ry="8" fill="#17271f" opacity=".12" />

      {poles && (
        <g stroke="#2b343a" strokeWidth="2" strokeLinecap="round">
          <path d="M110 22L64 4M122 22L76 4" />
          <path d="M40 3H150" stroke="#8a97a0" strokeWidth="1.5" />
        </g>
      )}
      {panto !== undefined && (
        <g stroke="#2b343a" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${panto - 14} 22L${panto} 9L${panto + 14} 22`} strokeWidth="2.5" />
          <path d={`M${panto - 10} 8H${panto + 10}`} strokeWidth="3" />
        </g>
      )}

      {/* body + livery stripe */}
      <rect x={x0} y="22" width={w} height="56" rx="10" fill={paint} stroke="#fff" strokeWidth="3" />
      <rect x={x0 + 4} y="64" width={w - 8} height="5" rx="2" fill="#fff" opacity=".85" />

      {/* windows */}
      {windows.map((x) => (
        <rect key={x} x={x} y="38" width="24" height="20" rx="3" fill={GLASS} />
      ))}

      {/* doors */}
      {doors.map((d) => (
        <g key={d}>
          <rect x={d} y="34" width="20" height="42" rx="2" fill="#cfe6ee" stroke="#fff" strokeWidth="1.5" />
          <path d={`M${d + 10} 34v42`} stroke="#8fb3c0" />
        </g>
      ))}

      {/* tram joint */}
      {bellows !== undefined && (
        <g>
          <rect x={bellows - 8} y="24" width="16" height="52" rx="3" fill="#1f2a32" />
          <path d={`M${bellows - 4} 26v48M${bellows} 26v48M${bellows + 4} 26v48`} stroke="#3a4852" />
        </g>
      )}

      <rect x={x0 + 2} y="74" width={w - 4} height="6" rx="2" fill={DARK} />

      {/* front: windshield, route sign, lights */}
      <rect x={x1 - 28} y="34" width="18" height="26" rx="4" fill={GLASS} />
      <rect x={x1 - 62} y="24" width="30" height="11" rx="3" fill="#fff" />
      <text x={x1 - 47} y="32.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#203247">
        {route}
      </text>
      <circle cx={x1 - 4} cy="68" r="3.5" fill="#fff4ae" />
      <rect x={x0} y="66" width="4" height="8" rx="1" fill="#d64b43" />

      {/* wheels */}
      {wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy="80" r="10" fill="#273039" />
          <circle cx={x} cy="80" r="4.5" fill="#cad1d3" />
        </g>
      ))}
    </svg>
  );
}