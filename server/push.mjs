/**
 * Web Push delivery. Subscriptions live in Supabase (`push_subscriptions`, see
 * supabase/migrations), written by signed-in users under row level security and
 * read here with the service role key, which never reaches the browser.
 */
import webpush from 'web-push';
import { supabaseAdmin } from './supabase-admin.mjs';

const SEND_CHUNK = 100;

let vapidReady = false;

function setup() {
  const env = process.env;
  const db = supabaseAdmin();
  const publicKey = env.VAPID_PUBLIC_KEY || env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!db || !publicKey || !privateKey || !subject) return null;
  if (!vapidReady) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
  }
  return { db };
}

/** Sends one payload to every row and deletes subscriptions the push service says are gone. */
async function deliver(db, rows, payload) {
  const body = JSON.stringify(payload);
  const gone = [];
  let sent = 0;
  let failed = 0;
  for (let index = 0; index < rows.length; index += SEND_CHUNK) {
    const results = await Promise.allSettled(
      rows.slice(index, index + SEND_CHUNK).map(row =>
        webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body,
          { TTL: 15 * 60, urgency: 'high' },
        ),
      ),
    );
    results.forEach((result, offset) => {
      if (result.status === 'fulfilled') {
        sent += 1;
        return;
      }
      const code = result.reason?.statusCode;
      if (code === 404 || code === 410) gone.push(rows[index + offset].endpoint);
      else {
        failed += 1;
        console.error('[push] Delivery failed:', code, result.reason?.body || result.reason?.message);
      }
    });
  }
  if (gone.length) {
    const { error } = await db.from('push_subscriptions').delete().in('endpoint', gone);
    if (error) console.error('[push] Could not remove expired subscriptions:', error.message);
  }
  return { sent, removed: gone.length, failed };
}

/** Sends a test notification to the devices of the user who owns the access token. */
export async function sendTestPush(accessToken) {
  const push = setup();
  if (!push) return { status: 503, body: { error: 'Push notifications are not configured on the server.' } };
  if (!accessToken) return { status: 401, body: { error: 'Sign in to send a test notification.' } };
  const { data: auth, error: authError } = await push.db.auth.getUser(accessToken);
  if (authError || !auth?.user) return { status: 401, body: { error: 'The session has expired. Sign in again.' } };
  const { data: rows, error } = await push.db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', auth.user.id);
  if (error) {
    console.error('[push] Could not read subscriptions:', error.message);
    return { status: 500, body: { error: 'Could not read push subscriptions.' } };
  }
  if (!rows.length) return { status: 404, body: { error: 'This account has no device subscribed to notifications.' } };
  const result = await deliver(push.db, rows, {
    title: 'next: тестове сповіщення',
    body: 'Сповіщення працюють. Так ви дізнаєтеся про повітряну тривогу у Львові.',
    tag: 'next-test',
    url: '/app',
  });
  return { status: 200, body: result };
}

const STATUS_TOPIC = { active: 'air-alert', clear: 'all-clear' };

const STATUS_PAYLOAD = {
  active: {
    title: 'Повітряна тривога у Львівській області',
    body: 'Пройдіть до найближчого укриття. Відкрийте next, щоб побачити укриття поруч.',
    tag: 'air-alert',
    url: '/app',
    requireInteraction: true,
  },
  clear: {
    title: 'Відбій тривоги у Львівській області',
    body: 'Загрозу знято. Стежте за офіційними повідомленнями.',
    tag: 'air-alert',
    url: '/app',
  },
};

const threatKey = threat => `${threat.time}|${threat.kind}|${threat.place}`;

function threatPayload(threat) {
  return {
    title: `${threat.kindLabel}: ${threat.placeUk}`.slice(0, 120),
    body: (threat.note || 'Будьте уважні й стежте за сигналами тривоги.').slice(0, 240),
    tag: `threat-${threatKey(threat)}`,
    url: '/app',
  };
}

async function subscriptionsFor(db, topic) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .contains('topics', [topic])
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

/**
 * Notifies subscribers when the Lviv region alert status changes (`air-alert`,
 * `all-clear`) and when the report lists Lviv threats not seen before
 * (`threats`). The stored state is claimed with a conditional update on
 * `updated_at`, so two overlapping runs cannot both send. The first run after
 * deploy only records the state: it is not news to anyone.
 */
export async function dispatchAirAlertPush(alert) {
  const push = setup();
  if (!push) return { skipped: 'not-configured' };
  const next = alert?.status;
  if (next !== 'active' && next !== 'clear') return { skipped: 'status-unknown' };

  const { data: current, error: readError } = await push.db
    .from('air_alert_state')
    .select('status, threat_keys, updated_at')
    .eq('id', 1)
    .maybeSingle();
  if (readError || !current) {
    console.error('[push] Could not read the alert state:', readError?.message ?? 'row 1 is missing');
    return { error: 'state-read-failed' };
  }

  const threats = Array.isArray(alert.threats) ? alert.threats : [];
  const keys = threats.map(threatKey);
  const firstRun = current.status === 'unknown' || current.threat_keys === null;
  const statusChanged = current.status !== next;
  const seen = new Set(current.threat_keys ?? []);
  const newThreats = firstRun ? [] : threats.filter(threat => !seen.has(threatKey(threat)));
  const keysChanged = keys.length !== seen.size || keys.some(key => !seen.has(key));
  if (!statusChanged && !keysChanged) return { changed: false, status: next };

  const { data: claimed, error: claimError } = await push.db
    .from('air_alert_state')
    .update({ status: next, threat_keys: keys, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .eq('updated_at', current.updated_at)
    .select('id');
  if (claimError) {
    console.error('[push] Could not update the alert state:', claimError.message);
    return { error: 'state-update-failed' };
  }
  if (!claimed?.length) return { changed: false, status: next, note: 'handled-by-another-run' };

  const result = { changed: true, status: next, sent: 0, removed: 0, failed: 0 };
  const add = delivery => {
    result.sent += delivery.sent;
    result.removed += delivery.removed;
    result.failed += delivery.failed;
  };
  try {
    if (statusChanged && current.status !== 'unknown') {
      add(await deliver(push.db, await subscriptionsFor(push.db, STATUS_TOPIC[next]), STATUS_PAYLOAD[next]));
    }
    if (newThreats.length) {
      const rows = await subscriptionsFor(push.db, 'threats');
      // One notification per new threat, newest report first, capped so a backlog does not flood phones.
      for (const threat of newThreats.slice(0, 3)) add(await deliver(push.db, rows, threatPayload(threat)));
    }
  } catch (error) {
    console.error('[push] Could not read subscriptions:', error.message);
    return { ...result, error: 'subscriptions-read-failed' };
  }
  return result;
}
