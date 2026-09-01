import { describe, expect, it } from 'vitest';
import {
  convAltitude,
  getRegexResultSize,
  parseBriefingString,
  parseCommLine,
  parseGeneratedAt,
  parseOrdnanceLine,
  parseSteerpointLine,
  parseSupportLine,
} from '@/scripts/BriefingParser';

describe('BriefingParser', () => {
  it('parses generated at timestamp', () => {
    const line = 'BRIEFING RECORD generated at 08/25/2026 14:30:00.';
    const date = parseGeneratedAt(line);
    expect(date).not.toBeNull();
    expect(date?.toISOString()).toBe('2026-08-25T14:30:00.000Z');
  });

  it('handles invalid generated at string', () => {
    expect(parseGeneratedAt('Invalid line')).toBeNull();
    expect(parseGeneratedAt('BRIEFING RECORD generated at invalid')).toBeNull();
  });

  it('converts altitude correctly', () => {
    expect(convAltitude('25.00M')).toBe('250000');
    expect(convAltitude('25000')).toBe('25000');
  });

  it('parses comm line', () => {
    const line = '  Tower:\tKunsan (TCN: 073X)\t292.3 MHz [1]\t126.5 MHz [1]\tPrimary tower';
    const comm = parseCommLine(line);
    expect(comm).not.toBeNull();
    expect(comm?.agency).toBe('Tower');
    expect(comm?.callsign).toBe('Kunsan');
    expect(comm?.tacan).toBe('073X');
    expect(comm?.uhfChnl).toBe('292.3');
    expect(comm?.uhfPreset).toBe('1');
    expect(comm?.vhfChnl).toBe('126.5');
    expect(comm?.vhfPreset).toBe('1');
    expect(comm?.notes).toBe('Primary tower');
  });

  it('parses steerpoint line', () => {
    const line = '  1\tTakeoff\t08:00:00\t\t0\t\t000\t\t0\t\t0\tTakeoff\tWedge\tNone';
    const sp = parseSteerpointLine(line);
    expect(sp).not.toBeNull();
    expect(sp?.no).toBe(1);
    expect(sp?.description).toBe('Takeoff');
    expect(sp?.action).toBe('Takeoff');
  });

  it('parses support line', () => {
    const line = '  Chalice (AWACS):\tE-3\tCowboy';
    const sup = parseSupportLine(line);
    expect(sup).not.toBeNull();
    expect(sup?.callsign).toBe('Chalice');
    expect(sup?.task).toBe('AWACS');
    expect(sup?.aircraft).toBe('E-3');
    expect(sup?.stationArea).toBe('Cowboy');
  });

  it('computes regex result size', () => {
    expect(getRegexResultSize(null)).toBe(0);
    expect(getRegexResultSize(['full', 'p1', 'p2', undefined])).toBe(1);
  });

  it('parses ordnance line', () => {
    const line = '  4x AGM-65D\t2x AIM-120C';
    const ord = parseOrdnanceLine(line);
    expect(ord).not.toBeNull();
    expect(ord?.[0]?.amount).toBe(4);
    expect(ord?.[0]?.type).toBe('AGM-65D');
  });

  it('parses empty briefing string without errors', () => {
    const briefing = parseBriefingString('');
    expect(briefing).toBeDefined();
    expect(briefing.pilotRoster).toEqual([]);
    expect(briefing.steerpoints).toEqual([]);
  });
});
