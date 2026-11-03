import { ROUTE_D } from "./landing-content";

/** The abstract map in the hero: water, a park and one vehicle on a route. Decorative only. */
export function LandingMapArt() {
  return (
    <div className="landing-map">
      <span className="landing-map-water" />
      <span className="landing-map-park" />
      <svg className="landing-map-route" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <path id="landing-route-path" d={ROUTE_D} />
        <circle cx="196" cy="96" r="7" className="landing-map-stop" />
        <g>
          <circle
            r="16"
            className="landing-map-vehicle"
            style={{ fill: "var(--fleet-trolleybus)" }}
          />
          <text textAnchor="middle" dominantBaseline="central" className="landing-map-vehicle-text">
            9
          </text>
          <animateMotion dur="9s" repeatCount="indefinite" rotate="0">
            <mpath href="#landing-route-path" />
          </animateMotion>
        </g>
      </svg>
    </div>
  );
}
