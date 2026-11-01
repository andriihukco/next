import { useState } from "react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { TooltipProvider } from "../components/ui/tooltip";
import {
  BLOCKS,
  LEVELS,
  TEMPLATES,
  blockById,
  defaultValues,
  type Block,
  type PropSpec,
  type Values,
} from "./atomic";

/**
 * Builder: compose atoms, molecules, organisms and a template into a screen, like building with bricks.
 * Pick a template, add blocks from the palette, edit their props, and copy the JSX.
 * The preview is web only. The iOS and Android kits are composed the same way in mobile/src/ui.
 */

type Placed = { uid: number; blockId: string; values: Values };

let nextUid = 1;

function place(block: Block): Placed {
  return { uid: nextUid++, blockId: block.id, values: defaultValues(block) };
}

function PropField({
  spec,
  value,
  onChange,
}: {
  spec: PropSpec;
  value: string | boolean;
  onChange: (next: string | boolean) => void;
}) {
  const id = `builder-${spec.key}-${spec.label}`;
  if (spec.kind === "toggle") {
    return (
      <div className="ds-builder-field ds-builder-field-row">
        <Switch id={id} checked={value === true} onCheckedChange={onChange} />
        <Label htmlFor={id}>{spec.label}</Label>
      </div>
    );
  }
  if (spec.kind === "select") {
    return (
      <div className="ds-builder-field">
        <Label htmlFor={id}>{spec.label}</Label>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger id={id} aria-label={spec.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {spec.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option.startsWith("var(") ? option.replace(/^var\(--(.+)\)$/, "$1") : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div className="ds-builder-field">
      <Label htmlFor={id}>{spec.label}</Label>
      <Input id={id} value={String(value)} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function canvasCode(template: string, placed: Placed[]) {
  const body = placed
    .map((item) => {
      const block = blockById(item.blockId);
      return block
        ? block
            .code(item.values)
            .split("\n")
            .map((line) => `  ${line}`)
            .join("\n")
        : "";
    })
    .join("\n");
  return `<Screen template="${template}">\n${body}\n</Screen>`;
}

export function DesignBuilder() {
  const [template, setTemplate] = useState<"map" | "list">("map");
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedItem = placed.find((item) => item.uid === selected) ?? null;
  const selectedBlock = selectedItem ? blockById(selectedItem.blockId) : undefined;

  const add = (block: Block) => {
    const item = place(block);
    setPlaced((items) => [...items, item]);
    setSelected(item.uid);
  };

  const move = (uid: number, direction: -1 | 1) => {
    setPlaced((items) => {
      const index = items.findIndex((item) => item.uid === uid);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (uid: number) => {
    setPlaced((items) => items.filter((item) => item.uid !== uid));
    setSelected(null);
  };

  const setValue = (uid: number, key: string, value: string | boolean) => {
    setPlaced((items) =>
      items.map((item) =>
        item.uid === uid ? { ...item, values: { ...item.values, [key]: value } } : item,
      ),
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(canvasCode(template, placed));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked; the code is in the page to copy by hand.
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="ds-builder">
        <div className="ds-builder-palette">
          <p className="ds-eyebrow">Palette</p>
          {LEVELS.map((level) => (
            <section key={level.id} className="ds-builder-level" aria-label={level.label}>
              <h3 className="ds-builder-level-title">{level.label}</h3>
              <p className="ds-builder-level-rule">{level.rule}</p>
              <div className="ds-builder-palette-list">
                {level.id === "template"
                  ? TEMPLATES.map((item) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setTemplate(item.id)}
                        title={item.description}
                      >
                        {item.name}
                      </Button>
                    ))
                  : BLOCKS.filter((block) => block.level === level.id).map((block) => (
                      <Button
                        key={block.id}
                        variant="outline"
                        size="sm"
                        onClick={() => add(block)}
                        title={block.description}
                      >
                        + {block.name}
                      </Button>
                    ))}
              </div>
            </section>
          ))}
        </div>

        <div className="ds-builder-stage">
          <div className="ds-builder-toolbar">
            <div className="ds-builder-field">
              <Label htmlFor="builder-template">Template</Label>
              <Select
                value={template}
                onValueChange={(next) => setTemplate(next as "map" | "list")}
              >
                <SelectTrigger id="builder-template" aria-label="Template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? "Copied" : "Copy JSX"}
            </Button>
          </div>

          <div
            className={`ds-builder-frame ds-builder-frame-${template}`}
            aria-label="Screen preview"
          >
            {placed.length === 0 ? (
              <p className="ds-builder-empty">
                Add blocks from the palette. Each one lands at the end of the screen.
              </p>
            ) : (
              placed.map((item) => {
                const block = blockById(item.blockId);
                return block ? (
                  <div
                    key={item.uid}
                    className={`ds-builder-slot${selected === item.uid ? " is-selected" : ""}`}
                    onClick={() => setSelected(item.uid)}
                  >
                    {block.render(item.values)}
                  </div>
                ) : null;
              })
            )}
          </div>

          <h3 className="ds-builder-list-title">Screen</h3>
          <ol className="ds-builder-list">
            {placed.map((item, index) => {
              const block = blockById(item.blockId);
              return (
                <li key={item.uid} className="ds-builder-list-row">
                  <Button
                    variant={selected === item.uid ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSelected(item.uid)}
                  >
                    {index + 1}. {block?.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => move(item.uid, -1)}
                    aria-label="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => move(item.uid, 1)}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(item.uid)}>
                    Remove
                  </Button>
                </li>
              );
            })}
          </ol>

          {selectedItem && selectedBlock ? (
            <section className="ds-builder-props" aria-label={`${selectedBlock.name} props`}>
              <h3 className="ds-builder-list-title">{selectedBlock.name}</h3>
              <p className="ds-builder-level-rule">{selectedBlock.description}</p>
              {selectedBlock.props.map((spec) => (
                <PropField
                  key={spec.key}
                  spec={spec}
                  value={selectedItem.values[spec.key]}
                  onChange={(next) => setValue(selectedItem.uid, spec.key, next)}
                />
              ))}
            </section>
          ) : null}

          <pre className="ds-builder-code">
            <code>{canvasCode(template, placed)}</code>
          </pre>
        </div>
      </div>
    </TooltipProvider>
  );
}
