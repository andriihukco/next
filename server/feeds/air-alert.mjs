import { parseLvivAirAlert } from '../lib/air-alert-parse.mjs';

const ALERTS_URL = process.env.ALERTS_URL || 'https://api.alerts.in.ua/v3/alerts/active.md';
let cachedAirAlert = {
  status: 'unknown',
  level: null,
  since: null,
  sinceText: null,
  areasAffected: [],
  threats: [],
  reportAt: null,
  updatedAt: 0,
  source: 'alerts.in.ua'
};

/** The last known Lviv air alert status. */
export function getAirAlert() {
  return cachedAirAlert;
}

async function requestAlertText(url = ALERTS_URL) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 un/1.0' },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    throw new Error(`Alert status request failed with ${response.status}`);
  }
  return response.text();
}

export async function loadAirAlert() {
  try {
    const document = await requestAlertText();
    cachedAirAlert = { ...parseLvivAirAlert(document), updatedAt: Date.now(), source: 'alerts.in.ua' };
  } catch (error) {
    console.error('[alerts.in.ua] Alert load error:', error);
    cachedAirAlert = { ...cachedAirAlert, status: cachedAirAlert.updatedAt ? cachedAirAlert.status : 'unknown' };
  }
}
