import { type ReactNode } from "react";
import { DOC_PAGES, type PageId } from "./design-docs";

/**
 * A small markdown renderer for design/*.md: headings, paragraphs, lists, tables, code, quotes and
 * inline code, bold, italic and links. Output is React elements only, so no raw HTML is injected.
 */

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; id: string; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; text: string }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "quote"; text: string }
  | { type: "rule" };

export type Heading = { level: 2 | 3; id: string; text: string };

const LIST_ITEM = /^\s*([-*]|\d+\.)\s+(.*)$/;
const BLOCK_START = /^(```|#{1,4}\s|>|\s*([-*]|\d+\.)\s|\|)/;
const INLINE = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;

/** Heading text without markup, used for anchor ids and the "On this page" list. */
export function plainText(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1");
}

function slugify(text: string) {
  return plainText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const seen = new Map<string, number>();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const text = heading[2].trim();
      const base = slugify(text);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3 | 4,
        id: count ? `${base}-${count}` : base,
        text,
      });
      i += 1;
      continue;
    }

    if (/^-{3,}$/.test(line.trim())) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }

    if (line.trim().startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[i + 1].trim())) {
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (line.startsWith(">")) {
      const body: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        body.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: body.join(" ") });
      continue;
    }

    const first = LIST_ITEM.exec(line);
    if (first) {
      const ordered = /\d/.test(first[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const item = LIST_ITEM.exec(lines[i]);
        if (!item || /\d/.test(item[1]) !== ordered) break;
        items.push(item[2]);
        i += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraph = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

/** The h2 and h3 headings of a page, for the "On this page" list. */
export function pageHeadings(blocks: Block[]): Heading[] {
  return blocks.flatMap((block) =>
    block.type === "heading" && (block.level === 2 || block.level === 3)
      ? [{ level: block.level, id: block.id, text: plainText(block.text) }]
      : [],
  );
}

function renderLink(label: string, href: string, key: string, onOpenDoc: (id: PageId) => void): ReactNode {
  if (/^https?:\/\//.test(href)) {
    return (
      <a key={key} href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }

  // Links between the design docs (./foundations.md, ../design/foundations.md) open that page.
  // Links to files outside design/ (../DESIGN.md, tokens.json) show as code, since the site cannot open them.
  const file = href.replace(/^(\.{1,2}\/)+/, "").replace(/^design\//, "");
  const page = DOC_PAGES.find((doc) => doc.file === file);
  if (page) {
    return (
      <button key={key} type="button" className="ds-md-link" onClick={() => onOpenDoc(page.id)}>
        {label}
      </button>
    );
  }

  return <code key={key}>{label}</code>;
}

function renderInline(text: string, onOpenDoc: (id: PageId) => void): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    const key = String(index);
    if (index > last) nodes.push(text.slice(last, index));

    if (match[1] !== undefined) nodes.push(<code key={key}>{match[1]}</code>);
    else if (match[2] !== undefined) nodes.push(renderLink(match[2], match[3], key, onOpenDoc));
    else if (match[4] !== undefined) nodes.push(<strong key={key}>{match[4]}</strong>);
    else nodes.push(<em key={key}>{match[5]}</em>);

    last = index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderBlock(block: Block, index: number, onOpenDoc: (id: PageId) => void): ReactNode {
  switch (block.type) {
    case "heading": {
      const content = renderInline(block.text, onOpenDoc);
      if (block.level === 1) return <h1 key={index} id={block.id}>{content}</h1>;
      if (block.level === 2) return <h2 key={index} id={block.id}>{content}</h2>;
      if (block.level === 3) return <h3 key={index} id={block.id}>{content}</h3>;
      return <h4 key={index} id={block.id}>{content}</h4>;
    }
    case "paragraph":
      return <p key={index}>{renderInline(block.text, onOpenDoc)}</p>;
    case "list": {
      const items = block.items.map((item, itemIndex) => (
        <li key={itemIndex}>{renderInline(item, onOpenDoc)}</li>
      ));
      return block.ordered ? <ol key={index}>{items}</ol> : <ul key={index}>{items}</ul>;
    }
    case "code":
      return (
        <pre key={index}>
          <code>{block.text}</code>
        </pre>
      );
    case "table":
      return (
        <div key={index} className="ds-md-table">
          <table>
            <thead>
              <tr>
                {block.header.map((cell, cellIndex) => (
                  <th key={cellIndex} scope="col">
                    {renderInline(cell, onOpenDoc)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{renderInline(cell, onOpenDoc)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quote":
      return <blockquote key={index}>{renderInline(block.text, onOpenDoc)}</blockquote>;
    case "rule":
      return <hr key={index} />;
  }
}

/** Renders one design/*.md page. `blocks` comes from parseMarkdown, so the caller can reuse it for the TOC. */
export function Markdown({ blocks, onOpenDoc }: { blocks: Block[]; onOpenDoc: (id: PageId) => void }) {
  return <div className="ds-md">{blocks.map((block, index) => renderBlock(block, index, onOpenDoc))}</div>;
}
