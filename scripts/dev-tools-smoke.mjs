// Minimal CDP smoke test for the developer tools route gate.
// Usage: node scripts/dev-tools-smoke.mjs [baseUrl]
const baseUrl = process.argv[2] ?? "http://localhost:5199";

const cdpPort = process.env.CDP_PORT ?? "9222";
const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
const targets = await res.json();
const page =
  targets.find((t) => t.type === "page" && t.url.includes("localhost")) ??
  targets.find((t) => t.type === "page");
if (!page) throw new Error("No Chrome page target found.");

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});
await new Promise((resolve) => ws.addEventListener("open", resolve));

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const messageId = ++id;
    pending.set(messageId, resolve);
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });

const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result?.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");

async function visit(path) {
  await send("Page.navigate", { url: `${baseUrl}${path}` });
  await new Promise((resolve) => setTimeout(resolve, 4000));
  return evaluate(`JSON.stringify({
    path: location.pathname,
    dock: !!document.querySelector('.dev-tools-dock'),
    trigger: !!document.querySelector('.dev-tools-trigger'),
    tabs: [...document.querySelectorAll('.dev-tools-tabs button')].map((b) => b.textContent.trim()),
    badge: document.querySelector('.dev-tools-badge')?.textContent ?? null,
  })`);
}

console.log("/    ->", await visit("/"));
console.log("/dev ->", await visit("/dev"));

// Open the panel on /dev and check the tabs render.
await evaluate(`document.querySelector('.dev-tools-trigger')?.click()`);
await new Promise((resolve) => setTimeout(resolve, 500));
console.log("panel ->", await evaluate(`JSON.stringify({
  panel: !!document.querySelector('.dev-tools-panel'),
  tabs: [...document.querySelectorAll('.dev-tools-tabs button')].map((b) => b.textContent.trim()),
  hint: document.querySelector('.dev-tools-hint')?.textContent?.slice(0, 60) ?? null,
})`));

// Switch to the Runtime tab.
await evaluate(`[...document.querySelectorAll('.dev-tools-tabs button')].find((b) => b.textContent.includes('Runtime'))?.click()`);
await new Promise((resolve) => setTimeout(resolve, 400));
console.log("runtime ->", await evaluate(`JSON.stringify({
  rows: [...document.querySelectorAll('.dev-tools-diagnostics > div')].map((d) => d.textContent.trim()),
})`));

ws.close();
