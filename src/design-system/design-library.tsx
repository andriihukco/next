import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { DesignSystemPage } from "./design-system-page";

type Platform = "web" | "ios" | "android";
const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "web", label: "Web" },
  { id: "ios", label: "iOS" },
  { id: "android", label: "Android" },
];

/**
 * Where the mobile library runs: the Expo web server in development (`npm run design:mobile`),
 * or a hosted export set with VITE_DESIGN_MOBILE_URL. See design/README.md.
 */
const MOBILE_URL: string | null =
  import.meta.env.VITE_DESIGN_MOBILE_URL?.trim() || (import.meta.env.DEV ? "http://localhost:8094" : null);

const DOCS = [
  { file: "README.md", label: "Overview and how to use it" },
  { file: "foundations.md", label: "Color, type, space, radius" },
  { file: "platforms.md", label: "Web, iOS and Android rules" },
  { file: "navigation.md", label: "Tabs, pages and sheets" },
  { file: "components.md", label: "Every component and when to use it" },
  { file: "screens.md", label: "Every screen and flow" },
];

function readPlatform(): Platform {
  const value = new URLSearchParams(window.location.search).get("platform");
  return value === "ios" || value === "android" ? value : "web";
}

/**
 * /design: the next design library. One switch shows each element as it ships on the web, on iOS
 * and on Android. Web renders the web components; iOS and Android render the mobile kit
 * (mobile/src/ui) through the Expo app's /design screen, so both stay synced with the code.
 */
export function DesignLibrary() {
  const [platform, setPlatform] = useState<Platform>(readPlatform);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (platform === "web") url.searchParams.delete("platform");
    else url.searchParams.set("platform", platform);
    window.history.replaceState(null, "", url);
  }, [platform]);

  return (
    <div className="ds-page">
      <header className="ds-header">
        <div>
          <p className="ds-eyebrow">next design library</p>
          <h1>Design</h1>
          <p className="ds-lede">
            One token source (design/tokens.json), one component set per platform. Pick a platform to see each element as it
            ships. Rules and screens are documented in design/.
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          value={platform}
          onValueChange={(next) => next && setPlatform(next as Platform)}
          aria-label="Platform"
        >
          {PLATFORMS.map((item) => (
            <ToggleGroupItem key={item.id} value={item.id}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </header>

      <nav aria-label="Design docs" className="ds-docs">
        {DOCS.map((doc) => (
          <span key={doc.file} className="ds-doc">
            <code>design/{doc.file}</code>
            <span>{doc.label}</span>
          </span>
        ))}
      </nav>

      {platform === "web" ? (
        <DesignSystemPage embedded />
      ) : MOBILE_URL ? (
        <div className="ds-device-wrap">
          <div className={`ds-device ds-device-${platform}`}>
            <iframe
              key={platform}
              title={`Mobile design library, ${platform === "ios" ? "iOS" : "Android"}`}
              src={`${MOBILE_URL}/design?os=${platform}&embed=1`}
              className="ds-device-screen"
            />
          </div>
          <p className="ds-device-note">
            {platform === "ios"
              ? "Apple HIG: large titles, inset grouped lists, chevrons, rounded-rectangle buttons, light haptics."
              : "Material 3: top app bar, filled lists without chevrons, pill buttons, ripples, filter chips with a check."}{" "}
            Rendered live from mobile/src/ui.
          </p>
        </div>
      ) : (
        <div className="ds-device-wrap">
          <p className="ds-device-note">
            The mobile library is not hosted here yet. Run <code>npm run design:mobile</code> locally, or set
            VITE_DESIGN_MOBILE_URL to a hosted export.
          </p>
        </div>
      )}
    </div>
  );
}
