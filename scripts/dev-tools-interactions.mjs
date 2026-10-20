// Interaction smoke test for the developer tools panel.
// Usage: node scripts/dev-tools-interactions.mjs [baseUrl]
const baseUrl = process.argv[2] ?? "http://localhost:5199";

const cdpPort = process.env.CDP_PORT ?? "9222";
const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
const targets = await res.json();
const page =
  targets.find((t) => t.type === "page" && t.url.includes("localhost")) ??
  targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    console.log("CONSOLE ERROR:", message.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
  }
  if (message.method === "Runtime.exceptionThrown") {
    console.log("EXCEPTION:", String(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text).slice(0, 400));
  }
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
  if (result.result?.exceptionDetails) {
    return `ERROR: ${result.result.exceptionDetails.exception?.description}`;
  }
  return result.result?.result?.value;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await send("Page.enable");
await send("Runtime.enable");

const openPanel = async () => {
  await evaluate(`document.querySelector('.dev-tools-trigger')?.click()`);
  await wait(400);
};

// 1. Load /dev and open the panel.
await send("Page.navigate", { url: `${baseUrl}/dev` });
await wait(5000);
await openPanel();

// 2. Enable the fixtures and pick the "peak" scenario.
await evaluate(`(() => {
  const toggle = document.querySelector('#dev-fixtures-enabled');
  if (toggle && toggle.getAttribute('data-state') !== 'checked') toggle.click();
})()`);
await wait(600);
await evaluate(`(() => {
  const select = document.querySelector('#dev-fixture-scenario');
  select.value = 'peak';
  select.dispatchEvent(new Event('change', { bubbles: true }));
})()`);
await wait(1200);

console.log(
  "fixtures ->",
  await evaluate(`JSON.stringify({
    dot: !!document.querySelector('.dev-tools-dot'),
    scenario: document.querySelector('#dev-fixture-scenario')?.value,
    transportLabel: [...document.querySelectorAll('.dev-tools-diagnostics > div')]
      .map((d) => d.textContent.trim())
      .find((t) => t.startsWith('Транспорт')) ?? null,
    vehicles: document.querySelector('.dev-tools-diagnostics b')?.textContent ?? null,
  })`),
);

// 3. Run the fixture smoke checks.
console.log(
  "pre-checks ->",
  await evaluate(`JSON.stringify({
    panelOpen: !!document.querySelector('.dev-tools-panel'),
    buttons: [...document.querySelectorAll('.dev-tools-panel button')].map((b) => b.textContent.trim()),
  })`),
);
await evaluate(`[...document.querySelectorAll('button')]
  .find((b) => b.textContent.includes('Перевірити fixtures'))?.click()`);
await wait(1500);
console.log(
  "checks ->",
  await evaluate(`JSON.stringify({
    summary: document.querySelector('.dev-tools-checks strong')?.textContent?.trim() ?? null,
    failed: [...document.querySelectorAll('.dev-tools-checks .failed')].map((d) => d.textContent.trim()),
  })`),
);

// 4. Keyboard shortcut toggles the panel (Ctrl + Shift + D).
await evaluate(`document.querySelector('.dev-tools-trigger')?.focus()`);
const pressShortcut = async () => {
  for (const type of ["keyDown", "keyUp"]) {
    await send("Input.dispatchKeyEvent", {
      type,
      key: "D",
      code: "KeyD",
      text: type === "keyDown" ? "D" : undefined,
      modifiers: 10, // Ctrl (2) + Shift (8)
      windowsVirtualKeyCode: 68,
    });
  }
  await wait(500);
};
await pressShortcut();
console.log(
  "shortcut (1st) ->",
  await evaluate(`JSON.stringify({ panelOpen: !!document.querySelector('.dev-tools-panel') })`),
);
await pressShortcut();
console.log(
  "shortcut (2nd) ->",
  await evaluate(`JSON.stringify({ panelOpen: !!document.querySelector('.dev-tools-panel') })`),
);

// 5. Client-side navigation away from /dev hides the tools.
await evaluate(`history.pushState({}, '', '/')`);
await wait(700);
console.log(
  "after pushState('/') ->",
  await evaluate(`JSON.stringify({ dock: !!document.querySelector('.dev-tools-dock'), path: location.pathname })`),
);

// 6. Back to /dev through the history API.
await evaluate(`history.pushState({}, '', '/dev')`);
await wait(700);
console.log(
  "after pushState('/dev') ->",
  await evaluate(`JSON.stringify({ dock: !!document.querySelector('.dev-tools-dock'), path: location.pathname })`),
);

ws.close();
