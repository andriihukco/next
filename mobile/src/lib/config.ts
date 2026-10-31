/** Same backend as the web app. Override with EXPO_PUBLIC_API_URL for a local server. */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://next-omega-navy.vercel.app"
).replace(/\/$/, "");

