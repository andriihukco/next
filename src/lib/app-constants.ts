/** Map and city constants used by the city screen. */

export const CENTER: [number, number] = [24.0297, 49.8397];
export const LVIV_REGION_BOUNDS: [[number, number], [number, number]] = [
  [22.6, 48.5],
  [25.6, 50.6],
];
export const CITY_UPDATES_ENDPOINT = import.meta.env.VITE_CITY_UPDATES_ENDPOINT?.trim();
export const TELEGRAM_CHANNEL_URL = (() => {
  const configuredUrl = import.meta.env.VITE_TELEGRAM_CHANNEL_URL?.trim();
  if (!configuredUrl) return "";
  try {
    const url = new URL(configuredUrl);
    if (url.protocol === "https:" && url.hostname === "t.me") {
      return url.href;
    }
  } catch (error) {
    console.error("The configured Telegram channel URL is invalid.", error);
    return "";
  }
  console.error("The Telegram channel URL must be an HTTPS t.me link.");
  return "";
})();
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
