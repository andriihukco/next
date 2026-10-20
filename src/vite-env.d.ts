/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: "development" | "staging" | "production";
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TELEGRAM_CHANNEL_URL?: string;
  readonly VITE_CITY_UPDATES_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
