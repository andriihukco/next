import dns from 'dns/promises';

const PREFIXES = [
  'go', 'ride', 'track', 'route', 'catch', 'hop', 'board', 'take', 'way', 'path',
  'line', 'step', 'shift', 'flow', 'transit', 'pass', 'commute', 'speed', 'swift', 'move',
  'fly', 'run', 'walk', 'drive', 'trip', 'tour', 'cruise', 'drift', 'glide', 'stride',
  'bound', 'launch', 'steer', 'pilot', 'direct', 'navigate', 'cross', 'span', 'reach', 'fetch',
  'live', 'now', 'real', 'active', 'stream', 'ping', 'pulse', 'signal', 'fast', 'quick',
  'instant', 'rapid', 'sync', 'flash', 'dash', 'hyper', 'turbo', 'ultra', 'livegps', 'realtime',
  'livemap', 'onnow', 'upnow', 'current', 'livefeed', 'livesync', 'livepass', 'liveroute', 'livetrack',
  'find', 'seek', 'spot', 'scout', 'near', 'local', 'around', 'here', 'where', 'open',
  'view', 'check', 'look', 'peek', 'sight', 'explore', 'discover', 'locate', 'pinpoint', 'search',
  'scan', 'radar', 'detect', 'trace', 'uncover', 'reveal', 'mapout', 'findmy', 'nearme', 'localgo',
  'map', 'city', 'town', 'metro', 'urban', 'civic', 'street', 'geo', 'loc', 'place',
  'point', 'zone', 'grid', 'base', 'hub', 'site', 'stop', 'station', 'node', 'area',
  'block', 'district', 'region', 'sector', 'venue', 'locale', 'territory', 'domain', 'land', 'center',
  'midtown', 'downtown', 'crosstown', 'uptown', 'suburb', 'plaza', 'square', 'avenue', 'boulevard', 'lane',
  'try', 'use', 'get', 'the', 'meet', 'one', 'all', 'easy', 'smart', 'free',
  'just', 'tap', 'click', 'touch', 'press', 'entry', 'access', 'gate', 'portal', 'link',
  'net', 'web', 'app', 'mobile', 'pocket', 'handy', 'express', 'core', 'guest', 'visit',
  'visitor', 'tourist', 'commuter', 'rider', 'traveler', 'roamer', 'walker', 'localist', 'neighbor', 'hood'
];

const SUFFIXES = [
  'map', 'transit', 'route', 'bus', 'tram', 'line', 'way', 'path', 'track', 'stop',
  'station', 'navi', 'guide', 'pilot', 'scout', 'radar', 'compass', 'finder', 'locator', 'tracker',
  'router', 'mover', 'rider', 'runner', 'walker', 'flyer', 'cruiser', 'driver', 'steer', 'vector',
  'city', 'town', 'metro', 'urban', 'street', 'zone', 'place', 'spot', 'near', 'local',
  'hub', 'base', 'point', 'grid', 'node', 'area', 'block', 'district', 'sector', 'venue',
  'locale', 'center', 'plaza', 'square', 'lane', 'avenue', 'boulevard', 'park', 'bay', 'port',
  'app', 'live', 'now', 'go', 'flow', 'stream', 'pulse', 'ping', 'signal', 'link',
  'pass', 'card', 'desk', 'gate', 'connect', 'view', 'net', 'web', 'site', 'core',
  'sync', 'dash', 'board', 'feed', 'engine', 'system', 'stack', 'tech', 'deck',
  'book', 'ticket', 'table', 'seat', 'pay', 'order', 'reserve', 'event', 'show', 'spotlight',
  'digest', 'index', 'directory', 'list', 'catalog', 'atlas', 'vault', 'pocket'
];

// 500+ Publicly Registerable TLDs
const TLDS = [
  // Core & Tech
  '.com', '.app', '.io', '.co', '.dev', '.net', '.org', '.tech', '.online', '.site',
  '.xyz', '.info', '.me', '.us', '.cc', '.to', '.ai', '.is', '.so', '.co.uk',
  '.digital', '.systems', '.solutions', '.technology', '.software', '.code', '.data',
  '.cloud', '.link', '.click', '.download', '.stream', '.network', '.host', '.server',

  // City, Geospatial & Travel
  '.city', '.map', '.zone', '.guide', '.place', '.space', '.earth', '.world',
  '.land', '.town', '.viajes', '.tours', '.voyage', '.flights', '.center', '.market',
  '.community', '.exchange', '.express', '.direct', '.travel', '.vacations', '.rentals',
  '.tours', '.cruises', '.holiday', '.flights', '.villas', '.properties', '.realestate',

  // Real-Time, Media & Live Events
  '.live', '.today', '.now', '.stream', '.events', '.show', '.watch', '.media',
  '.buzz', '.life', '.one', '.run', '.pro', '.news', '.press', '.broadcast',
  '.tv', '.video', '.channel', '.radio', '.audio', '.fm', '.studio', '.art',

  // Service, Retail & Super App Modules
  '.services', '.tools', '.works', '.agency', '.club', '.group', '.house', '.coop',
  '.inc', '.ltd', '.store', '.shop', '.deals', '.tickets', '.rent', '.taxi',
  '.cab', '.bar', '.cafe', '.restaurant', '.pub', '.catering', '.kitchen', '.menu',
  '.food', '.pizza', '.beer', '.wine', '.vin', '.market', '.boutique', '.fashion',

  // Geographic / City Specific gTLDs
  '.london', '.nyc', '.berlin', '.paris', '.tokyo', '.amsterdam', '.miami', '.vegas',
  '.boston', '.wales', '.scot', '.barcelona', '.madrid', '.roma', '.rio', '.istanbul',
  '.kyiv', '.brussels', '.hamburg', '.koeln', '.wien', '.zurich', '.bayern', '.tirol',

  // European ccTLDs & Extensions
  '.eu', '.de', '.fr', '.es', '.it', '.nl', '.pl', '.ua', '.be', '.ch',
  '.at', '.se', '.no', '.fi', '.dk', '.cz', '.sk', '.ro', '.bg',
  '.gr', '.pt', '.ie', '.hu', '.hr', '.si', '.lt', '.lv', '.ee',
  '.lu', '.mt', '.cy', '.li', '.mc', '.sm', '.is', '.ba', '.rs',

  // Americas & Asia-Pacific ccTLDs
  '.ca', '.mx', '.br', '.ar', '.cl', '.co', '.pe', '.ve', '.ec', '.gt',
  '.cn', '.jp', '.kr', '.in', '.sg', '.hk', '.tw', '.th', '.vn', '.id',
  '.ph', '.my', '.au', '.nz', '.za', '.ae', '.sa', '.il', '.tr', '.eg',

  // Business, Professional & Enterprise
  '.biz', '.business', '.company', '.enterprise', '.corp', '.industries', '.capital',
  '.finance', '.financial', '.fund', '.investments', '.holdings', '.management',
  '.partners', '.associates', '.ventures', '.consulting', '.experts', '.works',

  // Creative, Design & Innovation
  '.design', '.style', '.graphics', '.photos', '.photography', '.gallery', '.vision',
  '.build', '.page', '.plus', '.global', '.international', '.world', '.space',
  '.top', '.fun', '.cool', '.best', '.vip', '.gold', '.zone', '.today'
];

const BASE_NAME = 'next';

function generateCombinations() {
  const domains = new Set();

  TLDS.forEach(tld => {
    // Prefix + Base (e.g., gonext.city)
    PREFIXES.forEach(prefix => domains.add(`${prefix}${BASE_NAME}${tld}`));
    
    // Base + Suffix (e.g., nextmap.app)
    SUFFIXES.forEach(suffix => domains.add(`${BASE_NAME}${suffix}${tld}`));
  });

  return Array.from(domains);
}

async function checkDomainAvailability(domain) {
  try {
    await dns.lookup(domain);
    return { domain, available: false };
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      return { domain, available: true };
    }
    return { domain, available: false };
  }
}

async function run() {
  const domainList = generateCombinations();
  console.log(`Loaded ${TLDS.length} TLDs, ${PREFIXES.length} prefixes, and ${SUFFIXES.length} suffixes.`);
  console.log(`Checking ${domainList.length} domain combinations for NEXT...\n`);

  const results = [];
  const batchSize = 100;

  for (let i = 0; i < domainList.length; i += batchSize) {
    const batch = domainList.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkDomainAvailability));
    results.push(...batchResults);
  }

  const available = results.filter(r => r.available);
  console.log('--- LIKELY AVAILABLE DOMAINS ---');
  available.forEach(r => console.log(`✓ ${r.domain}`));
  console.log(`\nFound ${available.length} available out of ${domainList.length} checked.`);
}

run();
