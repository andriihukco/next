// The public alerts.in.ua situation report is a Markdown document with numbered
// sections. Parsing the sections keeps the Lviv entry apart from the regional
// history further down, which used to make a clear Lviv look like an active alert.
const LVIV_MATCH = /львів|lviv|дрогобич|стрий|самбір|червоноград|золочів|яворів/i;
const MONTH_NAMES = {
  Jan: 'січня', Feb: 'лютого', Mar: 'березня', Apr: 'квітня', May: 'травня', Jun: 'червня',
  Jul: 'липня', Aug: 'серпня', Sep: 'вересня', Oct: 'жовтня', Nov: 'листопада', Dec: 'грудня'
};
const MONTH_NUMBERS = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

function reportSections(document) {
  const sections = new Map();
  for (const part of document.split(/\n(?=##\s)/)) {
    const heading = part.match(/^##\s+(.+)/);
    if (!heading) continue;
    sections.set(heading[1].trim(), part);
  }
  return sections;
}

function sectionBody(sections, prefix) {
  for (const [heading, body] of sections) {
    if (heading.startsWith(prefix)) return body;
  }
  return '';
}

function reportClock(document) {
  const match = document.match(/Europe\/Kyiv,\s*(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})/);
  if (!match) return null;
  return {
    iso: `${match[1]}-${match[2]}-${match[3]}T${match[4]}+03:00`,
    day: Number(match[3]),
    month: Number(match[2])
  };
}

function parseSince(block, clock) {
  // Alerts that started today are reported as "since 14:45" without a date.
  const timeOnly = block.match(/since (\d{2}:\d{2})/);
  const match = block.match(/since ([A-Z][a-z]{2}) (\d{1,2}), (\d{2}:\d{2})/) ||
    (timeOnly ? [timeOnly[0], null, null, timeOnly[1]] : null);
  if (!match) return { since: null, sinceText: null };
  if (!match[1]) return { since: match[3], sinceText: `з ${match[3]}` };
  const [, monthName, dayText, time] = match;
  const day = Number(dayText);
  const month = MONTH_NUMBERS[monthName];
  if (!month) return { since: null, sinceText: `з ${time}` };
  const sinceText = clock && clock.day === day && clock.month === month
    ? `з ${time}`
    : `з ${day} ${MONTH_NAMES[monthName] || monthName}, ${time}`;
  return { since: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')} ${time}`, sinceText };
}

function parseAffectedAreas(block) {
  const match = block.match(/areas affected:\s*([\s\S]+?)(?:\s*\[|$)/);
  if (!match) return [];
  return [...match[1].matchAll(/\(([^)]+)\)/g)]
    .map(entry => entry[1].trim())
    .filter(name => name.length > 0);
}

function parseThreats(threatSection) {
  const threats = [];
  for (const line of threatSection.split('\n')) {
    const match = line.match(/^-\s+\*\*(\d{2}:\d{2})\s+—\s+([^*]+)\*\*\s+over\s+(.+?)\s+—\s*([\s\S]*)$/);
    if (!match) continue;
    const [, time, kindRaw, placeRaw, noteRaw] = match;
    const kind = /drone|uav|бпла|shahed|герань/i.test(`${kindRaw} ${noteRaw}`)
      ? 'drone'
      : /bomb|каб|авіабомб|kab/i.test(`${kindRaw} ${noteRaw}`)
        ? 'bomb'
        : 'other';
    const place = placeRaw.replace(/\s+/g, ' ').trim();
    const placeUk = (place.match(/\(([^)]*[А-Яа-яІіЇїЄєҐґ][^)]*)\)/) || [])[1] || place;
    const note = noteRaw.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').replace(/\s+/g, ' ').trim();
    threats.push({
      time,
      kind,
      kindLabel: kind === 'drone' ? 'Ударні БпЛА' : kind === 'bomb' ? 'Керовані авіабомби' : 'Загроза',
      place,
      placeUk,
      note
    });
  }
  return threats;
}

export function parseLvivAirAlert(document) {
  const sections = reportSections(document);
  const clock = reportClock(document);
  const statusBlock = sectionBody(sections, '3.')
    .split(/\n\n/)
    .find(block => /^\*\*[^*]*(?:Львівська область|Lvivska oblast)/m.test(block));
  const threats = parseThreats(sectionBody(sections, '4.'))
    .filter(threat => LVIV_MATCH.test(threat.place) || LVIV_MATCH.test(threat.note))
    .slice(0, 6);
  const reportAt = clock ? clock.iso : null;

  if (!statusBlock) {
    return { status: 'clear', level: null, since: null, sinceText: null, areasAffected: [], threats, reportAt };
  }

  const levelMatch = statusBlock.match(/\[(red|yellow)/i) || statusBlock.match(/Alert level:\s*(red|yellow)/i);
  return {
    status: 'active',
    level: levelMatch ? levelMatch[1].toLowerCase() : 'red',
    ...parseSince(statusBlock, clock),
    areasAffected: parseAffectedAreas(statusBlock),
    threats,
    reportAt
  };
}
