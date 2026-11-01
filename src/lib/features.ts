import { cityEvents, cityJobListings, cityRealEstateListings } from "./dev-tools/sample-listings";
import type { CityDirectoryListing, CityEvent } from "./listing-types";

/*
 * Feature flags (platform-plan §A5 D-B, D-E; §B2 S6). Each flag is a build-time
 * constant, so production builds drop the code and data behind it.
 */

/** Order, table, appointment and ticket flows. No provider is connected, so they are demo only. */
export const SERVICES_ENABLED: boolean =
  import.meta.env.DEV || import.meta.env.VITE_FEATURE_SERVICES === "1";

/** Sample events, jobs, homes and the modelled ridership chart. Development only. */
export const SAMPLE_CONTENT_ENABLED: boolean = import.meta.env.DEV;

/** Photos, ratings and contacts from the local Google Maps scraper. Development only (D-B). */
export const PLACE_LOOKUP_ENABLED: boolean = import.meta.env.DEV;

export const sampleEvents: CityEvent[] = SAMPLE_CONTENT_ENABLED ? cityEvents : [];
export const sampleJobListings: CityDirectoryListing[] = SAMPLE_CONTENT_ENABLED ? cityJobListings : [];
export const sampleRealEstateListings: CityDirectoryListing[] = SAMPLE_CONTENT_ENABLED ? cityRealEstateListings : [];
