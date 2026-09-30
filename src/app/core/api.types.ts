/**
 * Response shapes of the TrackBoard API (`/api/v1`). Mirrors the C# DTOs field for field;
 * durations are integer milliseconds and timestamps ISO-8601 strings.
 */

export type TrackType = 'Circuit' | 'Sprint';
export type TrackVisibility = 'Private' | 'Published';
export type SessionVisibility = 'Private' | 'Ranked';
export type GpsSource = 'Wifi' | 'Bluetooth' | 'PhoneGps';
export type UserRole = 'Driver' | 'Admin';

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

// ── Tracks ───────────────────────────────────────────────────────────────────

export interface TrackPoint {
  seq: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  isStartPoint: boolean;
  isSectorPoint: boolean;
  sectorIndex: number | null;
}

export interface TrackSummary {
  id: string;
  name: string;
  country: string;
  type: TrackType;
  visibility: TrackVisibility;
  lengthMeters: number | null;
  ownerDisplayName: string;
  startLatitude: number | null;
  startLongitude: number | null;
  distanceKm: number | null;
  sectorCount: number;
  rankedLapCount: number;
  geometryLocked: boolean;
}

export interface Track extends TrackSummary {
  points: TrackPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface SectorSplit {
  sectorIndex: number;
  splitMs: number;
}

export interface LeaderboardVehicle {
  manufacturer: string;
  model: string;
  year: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  lapTimeMs: number;
  gapToLeaderMs: number;
  sectors: SectorSplit[];
  vehicle: LeaderboardVehicle | null;
  setAt: string;
  gpsSource: GpsSource;
}

export interface Leaderboard {
  trackId: string;
  trackName: string;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

// ── Drivers (public) ─────────────────────────────────────────────────────────

export interface PublicStanding {
  trackId: string;
  trackName: string;
  country: string;
  trackType: TrackType;
  lengthMeters: number | null;
  rank: number;
  fieldSize: number;
  lapTimeMs: number;
  gapToLeaderMs: number;
  vehicle: LeaderboardVehicle | null;
  setAt: string;
  gpsSource: GpsSource;
}

export interface PublicDriver {
  id: string;
  displayName: string;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
  memberSince: string;
  standings: PublicStanding[];
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export interface Weather {
  tempC: number | null;
  humidityPct: number | null;
  precipitationMm: number | null;
  weatherCode: number | null;
  windKph: number | null;
  windDirDeg: number | null;
  pressureHpa: number | null;
}

export interface Lap {
  lapNumber: number;
  timeMs: number;
  signalGap: boolean;
  sectors: SectorSplit[];
  countsForLeaderboard: boolean;
  leaderboardRank: number | null;
}

export interface SessionSummary {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  trackId: string | null;
  trackName: string | null;
  vehicleId: string | null;
  gpsSource: GpsSource;
  visibility: SessionVisibility;
  voided: boolean;
  lapCount: number;
  bestLapMs: number | null;
}

export interface Session extends SessionSummary {
  weather: Weather | null;
  appVersion: string | null;
  laps: Lap[];
  createdAt: string;
  updatedAt: string;
}

// ── Vehicles ─────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  ownerId: string;
  ownerDisplayName: string;
  manufacturer: string;
  model: string;
  year: number;
  engineType: string;
  horsepower: number;
  torque: number | null;
  weight: number;
  topSpeed: number | null;
  acceleration: number | null;
  drivetrain: string;
  fuelType: string;
  tireType: string;
  fuelCapacity: number | null;
  transmission: string;
  suspensionType: string | null;
  createdAt: string;
  updatedAt: string;
  photoUrl: string | null;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  bio: string | null;
  country: string | null;
  avatarUrl: string | null;
  memberSince: string;
}

export interface UpdateProfile {
  displayName?: string;
  bio?: string;
  country?: string;
}

export interface VehicleRef {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  photoUrl: string | null;
}

export interface PersonalBest {
  trackId: string;
  trackName: string;
  country: string;
  trackType: TrackType;
  bestLapMs: number;
  setAt: string;
  vehicle: VehicleRef | null;
  lapCount: number;
  rank: number | null;
  fieldSize: number | null;
  rankedLapMs: number | null;
}

export interface ProfileStats {
  sessionCount: number;
  lapCount: number;
  trackCount: number;
  vehicleCount: number;
  distanceKm: number | null;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
  mainVehicle: VehicleRef | null;
  personalBests: PersonalBest[];
}

export interface UploadTarget {
  uploadUrl: string;
  path: string;
  publicUrl: string;
}

// ── Events (track days) ──────────────────────────────────────────────────────

export type EventStatus = 'Upcoming' | 'Live' | 'Finished';

export interface EventGroup {
  id: string;
  name: string;
}

export interface EventSummary {
  id: string;
  name: string;
  trackId: string;
  trackName: string;
  trackCountry: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  hostDisplayName: string;
  entryCount: number;
  isHost: boolean;
  isJoined: boolean;
  myGroupId: string | null;
  /** Only present for the host. */
  joinCode: string | null;
}

export interface EventEntry {
  userId: string;
  displayName: string;
  groupId: string | null;
  joinedAt: string;
}

export interface EventDetail {
  event: EventSummary;
  groups: EventGroup[];
  entries: EventEntry[];
}

export interface SaveEvent {
  name: string;
  trackId?: string;
  startsAt: string;
  endsAt: string;
  groups: { id?: string; name: string }[];
}

export interface EventBoardEntry {
  rank: number | null;
  groupRank: number | null;
  userId: string;
  displayName: string;
  groupId: string | null;
  bestLapMs: number | null;
  gapToLeaderMs: number | null;
  gapToGroupLeaderMs: number | null;
  bestLapSectors: SectorSplit[];
  lapCount: number;
  lastLapMs: number | null;
  lastLapIsBest: boolean;
  onTrack: boolean;
  lastActivityAt: string | null;
  vehicle: LeaderboardVehicle | null;
  gpsSource: GpsSource | null;
}

export interface EventBoard {
  eventId: string;
  name: string;
  trackId: string;
  trackName: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  groups: EventGroup[];
  entries: EventBoardEntry[];
  generatedAt: string;
}

/** RFC 7807 body the API returns on every error. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
