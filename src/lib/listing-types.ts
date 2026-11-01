/** Events and directory listings (jobs, homes, services) shown in the city guide. */

export type CityEvent = {
  id: string;
  day: string;
  month: string;
  time: string;
  name: string;
  venue: string;
  summary: string;
  category: string;
  coordinates: [number, number];
};

export type CityDirectoryListing = {
  id: string;
  name: string;
  category: string;
  summary: string;
  details: string;
  location: string;
  organization?: string;
  coordinates: [number, number];
};
