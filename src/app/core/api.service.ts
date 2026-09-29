import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Leaderboard,
  Paged,
  Profile,
  ProfileStats,
  PublicDriver,
  Session,
  SessionSummary,
  Track,
  TrackSummary,
  TrackType,
  UpdateProfile,
  UploadTarget,
  Vehicle,
} from './api.types';

export interface TrackQuery {
  page?: number;
  pageSize?: number;
  type?: TrackType | null;
  near?: { lat: number; lon: number } | null;
  radiusKm?: number;
  mine?: boolean;
}

/** Thin, typed wrapper over the TrackBoard REST API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/api/v1`;

  // ── Public ────────────────────────────────────────────────────────────────

  tracks(q: TrackQuery = {}): Observable<Paged<TrackSummary>> {
    let params = new HttpParams()
      .set('page', q.page ?? 1)
      .set('pageSize', q.pageSize ?? 50);
    if (q.type) params = params.set('type', q.type);
    if (q.near) {
      params = params
        .set('near', `${q.near.lat.toFixed(5)},${q.near.lon.toFixed(5)}`)
        .set('radiusKm', q.radiusKm ?? 100);
    }
    if (q.mine) params = params.set('mine', true);
    return this.http.get<Paged<TrackSummary>>(`${this.base}/tracks`, { params });
  }

  track(id: string): Observable<Track> {
    return this.http.get<Track>(`${this.base}/tracks/${id}`);
  }

  leaderboard(trackId: string, limit = 100): Observable<Leaderboard> {
    return this.http.get<Leaderboard>(`${this.base}/tracks/${trackId}/leaderboard`, {
      params: { limit },
    });
  }

  driver(id: string): Observable<PublicDriver> {
    return this.http.get<PublicDriver>(`${this.base}/drivers/${id}`);
  }

  // ── Driver area ───────────────────────────────────────────────────────────

  profile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.base}/me`);
  }

  updateProfile(body: UpdateProfile): Observable<Profile> {
    return this.http.patch<Profile>(`${this.base}/me`, body);
  }

  stats(): Observable<ProfileStats> {
    return this.http.get<ProfileStats>(`${this.base}/me/stats`);
  }

  export(): Observable<Blob> {
    return this.http.get(`${this.base}/me/export`, { responseType: 'blob' });
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.base}/me`);
  }

  createAvatarUpload(contentType: 'image/jpeg' | 'image/webp'): Observable<UploadTarget> {
    return this.http.post<UploadTarget>(`${this.base}/me/uploads`, { kind: 'Avatar', contentType });
  }

  /** Step two of an upload: the bytes go straight to storage, not through the API. */
  uploadBytes(target: UploadTarget, file: Blob, contentType: string): Observable<unknown> {
    return this.http.put(target.uploadUrl, file, { headers: { 'Content-Type': contentType } });
  }

  setAvatar(path: string): Observable<Profile> {
    return this.http.put<Profile>(`${this.base}/me/avatar`, { path });
  }

  clearAvatar(): Observable<Profile> {
    return this.http.delete<Profile>(`${this.base}/me/avatar`);
  }

  sessions(page = 1, trackId: string | null = null, pageSize = 25): Observable<Paged<SessionSummary>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (trackId) params = params.set('trackId', trackId);
    return this.http.get<Paged<SessionSummary>>(`${this.base}/sessions`, { params });
  }

  session(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.base}/sessions/${id}`);
  }

  vehicles(ownerId: string): Observable<Paged<Vehicle>> {
    // ownerId matters for admins only: without it an admin would list every garage.
    return this.http.get<Paged<Vehicle>>(`${this.base}/vehicles`, {
      params: { ownerId, pageSize: 100 },
    });
  }
}
