/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: "development" | "staging" | "production";
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TELEGRAM_CHANNEL_URL?: string;
  readonly VITE_CITY_UPDATES_ENDPOINT?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_AUTH_GOOGLE?: string;
  readonly VITE_TELEGRAM_BOT_ID?: string;
  /** "1" shows the demo service flows in a non-development build. */
  readonly VITE_FEATURE_SERVICES?: string;
  /** "1" shows «Видалити обліковий запис» in a non-development build. */
  readonly VITE_FEATURE_ACCOUNT_DELETION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
