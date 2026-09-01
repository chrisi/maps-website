import type {
  Briefing,
  CommAgency,
  ElemOrdnance,
  Flight,
  FlightOrdnance,
  Meta,
  MissionOverview,
  Ordnance,
  PackageElement,
  Pilot,
  Steerpoint,
  Support,
  Weather,
  WeatherCondition,
} from '@/model/briefing';

export function parseGeneratedAt(line: string): Date | null {
  const parts = line.split(' generated at ');
  if (parts.length !== 2) {
    return null;
  }
  let ts = parts[1].trim();
  if (ts.endsWith('.')) {
    ts = ts.slice(0, -1);
  }

  const spaceIndex = ts.indexOf(' ');
  if (spaceIndex === -1) {
    return null;
  }
  const datePart = ts.slice(0, spaceIndex);
  const timePart = ts.slice(spaceIndex + 1);

  const dateParts = datePart.split('/');
  if (dateParts.length !== 3) {
    return null;
  }
  const month = parseInt(dateParts[0], 10);
  const day = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);

  const timeParts = timePart.split(':');
  if (timeParts.length !== 3) {
    return null;
  }
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = parseInt(timeParts[2], 10);

  if (
    isNaN(month) ||
    isNaN(day) ||
    isNaN(year) ||
    isNaN(hour) ||
    isNaN(minute) ||
    isNaN(second)
  ) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

const reMissOverTitle = /^\s+([^\t]+)\s\((.+)\)\s*$/;
const reMissOverPackage = /^\s+([^\t]+):\t(\d+)\s\((.+)\)\s*$/;
const reMissOverDetail = /^\s+([^\t]+:)\s?\t(.+)\s*$/;
const reMissOverZuluLocal = /^\s+([^\t]+)\t(.+)z\((.+)l\)\s*$/;

export function parseMissionOverview(lines?: string[]): MissionOverview | null {
  if (!lines || lines.length < 10) {
    return null;
  }
  const mt = lines[1]?.match(reMissOverTitle);
  if (!mt) {
    throw new Error(`Mission-Overview-line invalid: ${lines[1]}`);
  }
  const mp = lines[3]?.match(reMissOverPackage);
  if (!mp) {
    throw new Error(`Mission-Overview-line invalid: ${lines[3]}`);
  }
  const md1 = lines[4]?.match(reMissOverDetail);
  if (!md1) {
    throw new Error(`Mission-Overview-line invalid: ${lines[4]}`);
  }
  const md2 = lines[5]?.match(reMissOverDetail);
  if (!md2) {
    throw new Error(`Mission-Overview-line invalid: ${lines[5]}`);
  }
  const md3 = lines[6]?.match(reMissOverDetail);
  if (!md3) {
    throw new Error(`Mission-Overview-line invalid: ${lines[6]} `);
  }
  const mzl1 = lines[8]?.match(reMissOverZuluLocal);
  if (!mzl1) {
    throw new Error(`Mission-Overview-line invalid: ${lines[8]} `);
  }
  const mzl2 = lines[9]?.match(reMissOverZuluLocal);
  if (!mzl2) {
    throw new Error(`Mission-Overview-line invalid: ${lines[9]}`);
  }

  const mo: MissionOverview = {
    flight: mt[1],
    missionType: mt[2],
    package: mp[2],
    packageType: mp[3],
    mission: md1[2],
    target: md2[2],
    timeOnTarget: md3[2],
    sunriseZulu: mzl1[2],
    sunriseLocal: mzl1[3],
    sunsetZulu: mzl2[2],
    sunsetLocal: mzl2[3],
  };
  return mo;
}

const reCommLine = /^\s*(.+):\t([^\t(]+)(?:\s\(TCN:\s(.+)\)\s*)?\t(?:(.+) MHz (?:\[(\d+)\])?|--)\t(?:(.+) MHz (?:\[(\d+)\])?|--)\t(.+)$/;

export function parseCommLine(line: string): CommAgency | null {
  const m = line.match(reCommLine);
  if (!m) {
    return null;
  }
  const com: CommAgency = {
    agency: m[1],
    callsign: m[2],
    tacan: m[3] || '',
    uhfChnl: m[4] || '',
    uhfPreset: m[5] || '',
    vhfChnl: m[6] || '',
    vhfPreset: m[7] || '',
    notes: m[8],
  };
  return com;
}

export function parseCommLadder(lines?: string[]): CommAgency[] {
  if (!lines || lines.length < 2) {
    return [];
  }
  const coms: CommAgency[] = [];
  for (const line of lines.slice(2)) {
    const com = parseCommLine(line);
    if (com !== null) {
      coms.push(com);
    }
  }
  return coms;
}

const reSteerpoint = /^\s+(\d+)\t+(.+)\t+(.+)\t\t(.+)\t\t(.+)\t\t(.+)\t\t(.+)\t(.*)\t(.*)\t(.*)$/;

export function parseSteerpointLine(line: string): Steerpoint | null {
  const m = line.match(reSteerpoint);
  if (!m) {
    return null;
  }
  const no = parseInt(m[1], 10);
  const com: Steerpoint = {
    no: isNaN(no) ? 0 : no,
    description: m[2],
    time: m[3],
    distance: m[4],
    heading: m[5],
    cas: m[6],
    altitude: m[7],
    action: m[8],
    formation: m[9],
    comments: m[10],
  };
  return com;
}

export function parseSteerpoints(lines?: string[]): Steerpoint[] {
  if (!lines || lines.length < 2) {
    return [];
  }
  const steerpoints: Steerpoint[] = [];
  for (const line of lines.slice(2)) {
    const steerpoint = parseSteerpointLine(line);
    if (steerpoint !== null) {
      steerpoints.push(steerpoint);
    }
  }
  return steerpoints;
}

const rePilotRoster = /^\s*([^\t]+)\t([^\t]+)(?:\t([^\t\r\n]+))?(?:\t([^\t\r\n]+))?(?:\t([^\t\r\n]+))?.*$/;

export function parsePilotRoster(lines?: string[]): Flight[] {
  if (!lines || lines.length < 3) {
    return [];
  }
  const flts: Flight[] = [];
  for (const line of lines.slice(3)) {
    if (line.trim().length === 0) {
      continue;
    }
    const plts: Pilot[] = [];
    const m = line.match(rePilotRoster);
    if (!m) {
      throw new Error(`could not parse pilot roster from: ${line}`);
    }
    for (let i = 2; i <= 5; i++) {
      if (m[i]) {
        plts.push({
          callsign: m[1] + (i - 1).toString(),
          name: m[i],
        });
      } else {
        plts.push({
          callsign: '',
          name: '',
        });
      }
    }
    flts.push({
      callsign: m[1],
      pilots: plts,
    });
  }
  return flts;
}

const rePackage1 = /^\s+(.+)\t(\d+)(\s\(x\s\)\s)?\t(.+)\t(\d+)\s(.+)\s\t(.+)$/;
const rePackage2 = /^\s+.+:\s(.+)\t+.+:\s(.+)\t+.+:\s(.+)\t+.+:\s(.+)?$/;

export function parsePackage(line1: string, line2?: string): PackageElement | null {
  const m1 = line1.match(rePackage1);
  if (!m1) {
    return null;
  }
  const m2 = line2 ? line2.match(rePackage2) : null;
  const no = parseInt(m1[2], 10);
  const size = parseInt(m1[5], 10);
  const flt: PackageElement = {
    callsign: m1[1],
    no: isNaN(no) ? 0 : no,
    role: m1[4],
    size: isNaN(size) ? 0 : size,
    aircraft: m1[6],
    task: m1[7],
    takeOff: m2 ? m2[1] || '' : '',
    push: m2 ? m2[2] || '' : '',
    target: m2 ? m2[3] || '' : '',
    iff: m2 ? m2[4] || '' : '',
    primary: m1[3] === ' (x ) ',
  };
  return flt;
}

export function parsePackageElements(lines?: string[]): PackageElement[] {
  if (!lines || lines.length < 3) {
    return [];
  }
  const pes: PackageElement[] = [];
  for (let i = 3; i < lines.length; i += 2) {
    if (lines[i].trim().length === 0) {
      continue;
    }
    const pe = parsePackage(lines[i], lines[i + 1]);
    if (pe !== null) {
      pes.push(pe);
    }
  }
  return pes;
}

const reOrdnance = /^\s+((\d+)x\s([^\t]+))?(\t(\d+)x\s([^\t]+))?(\t(\d+)x\s([^\t]+))?(\t(\d+)x\s([^\t]+))?$/;
const reOrdPackage = /^\s+([^\s+]+)(\t--\s\S+\s--)?(\t--\s\S+\s--)?(\t--\s\S+\s--)?(\t--\s\S+\s--)?$/;

export function getRegexResultSize(m: (string | undefined)[] | null): number {
  if (!m) {
    return 0;
  }
  for (let i = 1; i < m.length; i++) {
    if (!m[i] || m[i]!.length === 0) {
      return i - 2;
    }
  }
  return m.length - 2;
}

export function parseOrdnanceLine(line: string): Record<number, Ordnance> | null {
  const m = line.match(reOrdnance);
  if (!m) {
    return null;
  }
  let ofs = 1;
  let idx = 0;
  const ordnances: Record<number, Ordnance> = {};
  while (m.length > ofs && m[ofs]) {
    const amount = parseInt(m[ofs + 1], 10);
    const ordnance: Ordnance = {
      amount: isNaN(amount) ? 0 : amount,
      type: m[ofs + 2],
    };
    ordnances[idx] = ordnance;
    ofs += 3;
    idx++;
  }
  return ordnances;
}

export function parseFlightOrdnance(
  callsign: string,
  elemCnt: number,
  lines: string[]
): ElemOrdnance[] {
  const elemOrd: ElemOrdnance[] = [];
  for (let i = 0; i < elemCnt; i++) {
    elemOrd.push({
      callsign: callsign + (i + 1).toString(),
      ordnance: [],
    });
  }
  for (const line of lines) {
    if (line.length === 0) {
      break;
    }
    const ord = parseOrdnanceLine(line);
    if (ord) {
      for (const [kStr, v] of Object.entries(ord)) {
        const k = Number(kStr);
        if (elemOrd[k]) {
          elemOrd[k].ordnance.push(v);
        }
      }
    }
  }
  return elemOrd;
}

export function parseOrdnance(lines?: string[]): FlightOrdnance[] {
  if (!lines || lines.length < 3) {
    return [];
  }
  let lno = 3;
  const pkgOrd: FlightOrdnance[] = [];
  for (const line of lines.slice(3)) {
    lno++;
    const m = line.match(reOrdPackage);
    if (m !== null) {
      const size = getRegexResultSize(m);
      const callsign = m[1];
      const fltOrdData = parseFlightOrdnance(callsign, size, lines.slice(lno));
      const fltOrd: FlightOrdnance = {
        callsign: m[1],
        element: fltOrdData,
      };
      pkgOrd.push(fltOrd);
    }
  }
  return pkgOrd;
}

const reWeather = /^\s+([^\t]+):\s?\t(.*)\t(.*)\t(.*)$/;

export function parseWeather(lines?: string[]): Weather | null {
  if (!lines || lines.length < 9) {
    return null;
  }
  const rec: (RegExpMatchArray | null)[] = [];
  for (const line of lines.slice(3, 9)) {
    const m = line.match(reWeather);
    if (!m) {
      console.log('Weather-line invalid: ' + line);
      continue;
    }
    rec.push(m);
  }
  if (rec.length < 6 || rec.some((r) => r === null)) {
    return null;
  }
  const conds: WeatherCondition[] = [];
  for (let i = 2; i < 5; i++) {
    const cond: WeatherCondition = {
      situation: rec[0]![i] || '',
      wind: rec[1]![i] || '',
      visibility: rec[2]![i] || '',
      temperature: rec[3]![i] || '',
      cloudBase: rec[4]![i] || '',
      conLayer: rec[5]![i] || '',
    };
    conds.push(cond);
  }
  const weather: Weather = {
    takeOff: conds[0],
    targetArea: conds[1],
    landing: conds[2],
  };
  return weather;
}

const reSupport = /^\s*(.+)\s\((.+)\):\s*\t(.+)\t(.+)$/;

export function parseSupportLine(line: string): Support | null {
  const m = line.match(reSupport);
  if (!m) {
    return null;
  }
  const sup: Support = {
    callsign: m[1],
    task: m[2],
    aircraft: m[3],
    stationArea: m[4],
  };
  return sup;
}

export function parseSupport(lines?: string[]): Support[] {
  if (!lines || lines.length < 2) {
    return [];
  }
  const sups: Support[] = [];
  for (const line of lines.slice(2)) {
    if (line.trim().length === 0) {
      continue;
    }
    const sup = parseSupportLine(line);
    if (!sup) {
      throw new Error(`Support-line invalid: ${line} `);
    }
    sups.push(sup);
  }
  return sups;
}

export function parseAll(sections: Record<string, string[]>): Briefing {
  let mission: MissionOverview | null = null;
  try {
    mission = parseMissionOverview(sections['Mission Overview:']);
  } catch (err) {
    console.log(`parser-error while parsing section 'Mission Overview': ${err} `);
  }

  let pilotRoster: Flight[] = [];
  try {
    pilotRoster = parsePilotRoster(sections['Pilot Roster:']);
  } catch (err) {
    console.log(`parser-error while parsing section 'Package Elements': ${err} `);
  }

  let packageElements: PackageElement[] = [];
  try {
    const pkgKey =
      Object.keys(sections).find((k) => k.startsWith('Package Elements:')) ||
      'Package Elements: \tx  = Primary Flight';
    packageElements = parsePackageElements(sections[pkgKey] || sections['Package Elements: \tx  = Primary Flight']);
  } catch (err) {
    console.log(`parser-error while parsing section 'Package Elements': ${err} `);
  }

  let steerpoints: Steerpoint[] = [];
  try {
    steerpoints = parseSteerpoints(sections['Steerpoints:']);
  } catch (err) {
    console.log(`parser-error while parsing section 'Steerpoints': ${err} `);
  }

  let commLadder: CommAgency[] = [];
  try {
    commLadder = parseCommLadder(sections['Comm Ladder:']);
  } catch (err) {
    console.log(`parser-error while parsing section 'Comm Ladder': ${err} `);
  }

  let pkgOrd: FlightOrdnance[] = [];
  try {
    pkgOrd = parseOrdnance(sections['Ordnance:']);
  } catch (err) {
    console.log(`parser-error while parsing section 'Ordnance': ${err} `);
  }

  let weather: Weather | null = null;
  try {
    weather = parseWeather(sections['Weather:']);
  } catch (err) {
    console.log(`parser-error while parsing section 'Weather': ${err} `);
  }

  let support: Support[] = [];
  try {
    support = parseSupport(sections['Support:']);
  } catch (err) {
    console.log(`parser-error while parsing section 'Support': ${err} `);
  }

  const briefing: Briefing = {
    missionOverview: mission,
    pilotRoster,
    packageElements,
    steerpoints,
    commLadder,
    ordnance: pkgOrd,
    weather,
    support,
  };

  return briefing;
}

const reAltConv = /^(\d+)\.(\d+)M$/;

export function convAltitude(alt: string): string {
  const m = alt.match(reAltConv);
  if (!m) {
    return alt;
  }
  return m[1] + m[2] + '00';
}

export function normalizeBriefing(br: Briefing): void {
  if (br.steerpoints) {
    for (const sp of br.steerpoints) {
      sp.altitude = convAltitude(sp.altitude);
    }
  }
}

export const normalizBriefing = normalizeBriefing;

export function createMetadataFormFilename(
  filename: string,
  subject: string,
  callsign: string,
  rawBriefing: string,
  rawIni: string
): Meta {
  const meta: Meta = {
    subject,
    callsign,
    createdAt: new Date(),
    filename,
    rawBriefing,
    rawIni,
  };
  return meta;
}

export const createMetadataFromFilename = createMetadataFormFilename;

export function parseBriefingString(s: string): Briefing {
  const lines = s.split(/\r?\n/);

  const secs: Record<string, string[]> = {};
  let current = '';
  let generatedAt: Date | null = null;

  for (const line of lines) {
    if (line.startsWith('BRIEFING RECORD')) {
      generatedAt = parseGeneratedAt(line);
    }
    if (line.length > 1 && line[0] !== '\t' && line[0] !== ' ') {
      current = line;
      secs[current] = [];
      continue;
    }
    if (current !== '') {
      secs[current].push(line);
    }
  }

  const brief = parseAll(secs);
  brief.generatedAt = generatedAt;
  normalizeBriefing(brief);
  return brief;
}

export function parseBriefingReader(readerOrContent: string): Briefing {
  return parseBriefingString(readerOrContent);
}

export function parsesBriefingBytes(data: Uint8Array | ArrayBuffer | string): Briefing {
  if (typeof data === 'string') {
    return parseBriefingString(data);
  }
  const text = new TextDecoder('utf-8').decode(data);
  return parseBriefingString(text);
}

export const parseBriefingBytes = parsesBriefingBytes;
export const parseBriefing = parseBriefingString;

// PascalCase aliases for Go-compatibility
export const ParsesBriefingBytes = parsesBriefingBytes;
export const ParseBriefingString = parseBriefingString;
export const ParseBriefingReader = parseBriefingReader;
export const CreateMetadataFormFilename = createMetadataFormFilename;
