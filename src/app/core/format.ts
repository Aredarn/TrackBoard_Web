import { GpsSource, LeaderboardVehicle } from './api.types';

/** 41910 → "41.910"; 92345 → "1:32.345". Thousandths, as a timing sheet prints them. */
export function lapTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  const minutes = Math.floor(ms / 60_000);
  const seconds = (ms % 60_000) / 1000;
  return minutes > 0 ? `${minutes}:${seconds.toFixed(3).padStart(6, '0')}` : seconds.toFixed(3);
}

/** Gap behind a reference: "+0.512", or null for the reference itself. */
export function gap(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined || ms === 0) return null;
  return (ms > 0 ? '+' : '−') + lapTime(Math.abs(ms));
}

export function lengthKm(meters: number | null | undefined): string {
  if (!meters) return '—';
  return `${(meters / 1000).toLocaleString('en-GB', { maximumFractionDigits: 2 })} km`;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export const date = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const dateTime = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');
export const clock = (d: Date) => timeFmt.format(d);

/** Which rig timed the lap. The ESP32 connects over Wi-Fi or Bluetooth; both are the same module. */
export function gpsLabel(source: GpsSource): string {
  switch (source) {
    case 'Wifi':
      return 'ESP32 · Wi-Fi';
    case 'Bluetooth':
      return 'ESP32 · Bluetooth';
    case 'PhoneGps':
      return 'Phone GPS';
  }
}

/** Short code for tight table columns. */
export function gpsCode(source: GpsSource): string {
  return source === 'PhoneGps' ? 'PHONE' : 'ESP32';
}

export function vehicleName(v: LeaderboardVehicle | null | undefined): string {
  return v ? `${v.manufacturer} ${v.model}` : '—';
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;
}

/** WMO weather code, as Open-Meteo reports it, in a few plain words. */
export function weatherLabel(code: number | null | undefined): string | null {
  if (code === null || code === undefined) return null;
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}

/** The API speaks RFC 7807; turn whatever came back into one sentence a driver can act on. */
export function problemMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const e = error as { status?: number; error?: unknown } | null;
  if (!e) return fallback;
  if (e.status === 0) return 'Could not reach the TrackBoard server. Check your connection and try again.';
  if (e.status === 429) return 'Too many attempts in a minute. Wait a moment, then try again.';
  const body = e.error as { detail?: string; title?: string; errors?: Record<string, string[]> } | null;
  if (body && typeof body === 'object') {
    const firstField = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    return firstField ?? body.detail ?? body.title ?? fallback;
  }
  return fallback;
}
