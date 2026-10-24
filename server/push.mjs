/**
 * Web Push delivery. Subscriptions live in Supabase (`push_subscriptions`, see
 * supabase/migrations), written by signed-in users under row level security and
 * read here with the service role key, which never reaches the browser.
 */
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SEND_CHUNK = 100;

let state = null;

function setup() {
  if (state) return state;
  const env = process.env;
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = env.VAPID_PUBLIC_KEY || env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!url || !serviceKey || !publicKey || !privateKey || !subject) return null;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  state = { db: createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }) };
  return state;
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

const ALERT_PAYLOAD = {
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

/**
 * Notifies `air-alert` subscribers when the Lviv region alert status changes.
 * The stored status is claimed with a conditional update, so two overlapping
 * runs cannot both send the same notification. The first known status after
 * `unknown` is only recorded, because it is not a change users need to hear about.
 */
export async function dispatchAirAlertPush(alert) {
  const push = setup();
  if (!push) return { skipped: 'not-configured' };
  const next = alert?.status;
  if (next !== 'active' && next !== 'clear') return { skipped: 'status-unknown' };

  const { data: current, error: readError } = await push.db
    .from('air_alert_state')
    .select('status')
    .eq('id', 1)
    .maybeSingle();
  if (readError) {
    console.error('[push] Could not read the alert state:', readError.message);
    return { error: 'state-read-failed' };
  }
  const previous = current?.status ?? 'unknown';
  if (previous === next) return { changed: false, status: next };

  const { data: claimed, error: claimError } = await push.db
    .from('air_alert_state')
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .eq('status', previous)
    .select('id');
  if (claimError) {
    console.error('[push] Could not update the alert state:', claimError.message);
    return { error: 'state-update-failed' };
  }
  if (!claimed?.length) return { changed: false, status: next, note: 'handled-by-another-run' };
  if (previous === 'unknown') return { changed: true, status: next, sent: 0 };

  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await push.db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .contains('topics', ['air-alert'])
      .range(from, from + 999);
    if (error) {
      console.error('[push] Could not read subscriptions:', error.message);
      return { error: 'subscriptions-read-failed' };
    }
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return { changed: true, status: next, ...(await deliver(push.db, rows, ALERT_PAYLOAD[next])) };
}
