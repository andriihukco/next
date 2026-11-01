import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";

/** The three platforms the design library shows. Web renders web components; iOS and Android render the mobile kit. */
export type Platform = "web" | "ios" | "android";

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "web", label: "Web" },
  { id: "ios", label: "iOS" },
  { id: "android", label: "Android" },
];

/**
 * Where the mobile library runs: the Expo web server in development (`npm run design:mobile`),
 * or a hosted export set with VITE_DESIGN_MOBILE_URL. See design/README.md.
 */
export const MOBILE_URL: string | null =
  import.meta.env.VITE_DESIGN_MOBILE_URL?.trim() || (import.meta.env.DEV ? "http://localhost:8094" : null);

export function PlatformSwitch({ value, onChange }: { value: Platform; onChange: (next: Platform) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => next && onChange(next as Platform)}
      aria-label="Platform"
    >
      {PLATFORMS.map((item) => (
        <ToggleGroupItem key={item.id} value={item.id}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** A phone frame with the mobile library rendered inside it. `src` is a path on the Expo web server. */
export function DeviceFrame({ platform, src, title, note }: { platform: Exclude<Platform, "web">; src: string; title: string; note: string }) {
  return (
    <div className="ds-device-wrap">
      <div className={`ds-device ds-device-${platform}`}>
        <iframe key={src} title={title} src={src} className="ds-device-screen" />
      </div>
      <p className="ds-device-note">{note}</p>
    </div>
  );
}

export function platformName(platform: Exclude<Platform, "web">) {
  return platform === "ios" ? "iOS" : "Android";
}
