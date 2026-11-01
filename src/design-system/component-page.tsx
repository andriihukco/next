import { useState } from "react";
import { TooltipProvider } from "../components/ui/tooltip";
import { MOBILE_COUNTERPARTS, type ComponentDoc } from "./component-docs";
import { DeviceFrame, MOBILE_URL, PlatformSwitch, platformName, type Platform } from "./design-platform";

/** The headings a component page shows in "On this page". Ids match the section ids below. */
export const COMPONENT_HEADINGS = [
  { level: 2 as const, id: "preview", text: "Preview" },
  { level: 2 as const, id: "code", text: "Code" },
  { level: 2 as const, id: "props", text: "Props" },
  { level: 2 as const, id: "rules", text: "Rules" },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked; the code stays visible to copy by hand.
    }
  };

  return (
    <div className="ds-code">
      <button type="button" className="ds-code-copy" onClick={copy} aria-label="Copy code">
        {copied ? "Copied" : "Copy"}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** A component page: live preview, code, props and rules, in the order a developer reads them. */
export function ComponentPage({
  doc,
  platform,
  onPlatform,
}: {
  doc: ComponentDoc;
  platform: Platform;
  onPlatform: (next: Platform) => void;
}) {
  const { Preview } = doc;
  const counterpart = MOBILE_COUNTERPARTS[doc.slug];
  return (
    <TooltipProvider delayDuration={300}>
      <article className="ds-article-body ds-md">
        <p className="ds-eyebrow">Components · {doc.category}</p>
        <h1>{doc.title}</h1>
        <p className="ds-component-lede">{doc.description}</p>
        <p className="ds-component-file">
          <code>{doc.file}</code>
        </p>

        <h2 id="preview">Preview</h2>
        <div className="ds-preview-bar">
          <PlatformSwitch value={platform} onChange={onPlatform} />
        </div>
        {platform === "web" ? (
          <div className="ds-preview">
            <Preview />
          </div>
        ) : counterpart && MOBILE_URL ? (
          <DeviceFrame
            platform={platform}
            src={`${MOBILE_URL}/design?component=${doc.slug}&os=${platform}&embed=1`}
            title={`${doc.title}, ${platformName(platform)}`}
            note={`${platformName(platform)} counterpart: ${counterpart} from mobile/src/ui, rendered live.`}
          />
        ) : counterpart ? (
          <p className="ds-device-note">The mobile library is not hosted here yet. Run npm run design:mobile locally.</p>
        ) : (
          <p className="ds-device-note">
            No {platformName(platform)} element for {doc.title} yet. The mobile kit (mobile/src/ui) has no equivalent.
          </p>
        )}

        <h2 id="code">Code</h2>
        <CodeBlock code={doc.code} />

        <h2 id="props">Props</h2>
        <div className="ds-md-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Default</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {doc.props.map((prop) => (
                <tr key={prop.name}>
                  <td>
                    <code>{prop.name}</code>
                  </td>
                  <td>
                    <code>{prop.type}</code>
                  </td>
                  <td>{prop.default ? <code>{prop.default}</code> : "—"}</td>
                  <td>{prop.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {doc.rules && (
          <>
            <h2 id="rules">Rules</h2>
            <ul>
              {doc.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </>
        )}
      </article>
    </TooltipProvider>
  );
}
