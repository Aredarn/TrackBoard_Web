import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TrackPoint, TrackType } from '../core/api.types';

/** How one sector reads for the selected driver. */
export interface SectorMark {
  index: number;
  /** best: the driver holds the fastest split in the field; slower: they don't; none: no split. */
  state: 'best' | 'slower' | 'none';
  /** Printed beside the sector number, e.g. "+0.312". */
  note?: string | null;
}

interface Pt {
  x: number;
  y: number;
}

interface Segment {
  index: number;
  d: string;
  label: Pt;
  note: Pt;
  anchor: 'start' | 'middle' | 'end';
}

const W = 1000;
const MAX_H = 760;
const PAD = 70;

/**
 * The circuit as a timing sheet prints it: a double ink line traced from the track's own
 * ordered points, the start/finish chequer, the running direction, and one numbered
 * callout per sector. Sectors run from the start to the first sector point, between sector
 * points, and on to the finish, which is how TrackPro derives its gates.
 */
@Component({
  selector: 'tb-circuit-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (geometry(); as g) {
      <svg
        [attr.viewBox]="'0 0 ' + g.w + ' ' + g.h"
        role="img"
        [attr.aria-label]="ariaLabel()"
        preserveAspectRatio="xMidYMid meet"
      >
        <path class="casing" [attr.d]="g.full" pathLength="1" />
        @for (s of g.segments; track s.index) {
          @if (markFor(s.index)?.state === 'best') {
            <path class="sector-best" [attr.d]="s.d" />
          }
        }
        <path class="inner" [attr.d]="g.full" pathLength="1" />

        <!-- Running direction, just after the start. -->
        <polygon class="arrow" [attr.points]="g.arrow" />

        <!-- Start / finish chequer across the line. -->
        <g [attr.transform]="g.flag">
          @for (c of chequer; track $index) {
            <rect [attr.x]="c.x" [attr.y]="c.y" width="7" height="7" [attr.class]="c.dark ? 'chq-d' : 'chq-l'" />
          }
        </g>
        @if (g.finishFlag) {
          <g [attr.transform]="g.finishFlag">
            @for (c of chequer; track $index) {
              <rect [attr.x]="c.x" [attr.y]="c.y" width="7" height="7" [attr.class]="c.dark ? 'chq-d' : 'chq-l'" />
            }
          </g>
        }

        @if (g.segments.length > 1) {
          @for (s of g.segments; track s.index) {
            <g class="callout" [class.best]="markFor(s.index)?.state === 'best'">
              <circle [attr.cx]="s.label.x" [attr.cy]="s.label.y" r="19" />
              <text [attr.x]="s.label.x" [attr.y]="s.label.y" dy="0.36em">{{ s.index + 1 }}</text>
              @if (markFor(s.index)?.note; as note) {
                <text class="note" [attr.x]="s.note.x" [attr.y]="s.note.y" dy="0.36em" [attr.text-anchor]="s.anchor">{{ note }}</text>
              }
            </g>
          }
        }
      </svg>
    } @else {
      <p class="no-geo">No outline published for this track.</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    svg {
      width: 100%;
      height: auto;
      max-height: var(--map-max-h, 520px);
      overflow: visible;
    }

    path {
      fill: none;
      stroke-linejoin: round;
      stroke-linecap: round;
    }

    .casing {
      stroke: var(--ink);
      stroke-width: 15;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: trace 1.5s var(--ease-out) 120ms forwards;
    }

    .sector-best {
      stroke: var(--stamp);
      stroke-width: 15;
    }

    .inner {
      stroke: var(--paper);
      stroke-width: 5;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: trace 1.5s var(--ease-out) 220ms forwards;
    }

    @keyframes trace {
      to {
        stroke-dashoffset: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .casing,
      .inner {
        animation: none;
        stroke-dasharray: none;
        stroke-dashoffset: 0;
      }
    }

    .arrow {
      fill: var(--ink);
    }

    .chq-d {
      fill: var(--ink);
    }

    .chq-l {
      fill: var(--paper);
      stroke: var(--ink);
      stroke-width: 0.8;
    }

    .callout circle {
      fill: var(--paper);
      stroke: var(--ink);
      stroke-width: 2.5;
    }

    .callout text:not(.note) {
      fill: var(--ink);
      font-family: var(--font-sans);
      font-weight: 800;
      font-size: 20px;
      text-anchor: middle;
    }

    .callout.best circle {
      fill: var(--stamp);
      stroke: var(--stamp);
    }

    .callout.best text:not(.note) {
      fill: var(--on-stamp);
    }

    .callout .note {
      font-family: var(--font-typed);
      font-weight: 700;
      font-size: 19px;
      fill: var(--ink-2);
    }

    .callout.best .note {
      fill: var(--stamp);
    }

    .no-geo {
      padding: var(--s6) 0;
      color: var(--ink-2);
    }
  `,
})
export class CircuitMap {
  readonly points = input.required<TrackPoint[]>();
  readonly type = input<TrackType>('Circuit');
  readonly name = input('');
  readonly marks = input<SectorMark[] | null>(null);

  protected readonly chequer = Array.from({ length: 12 }, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    return { x: col * 7 - 21, y: row * 7 - 7, dark: (col + row) % 2 === 0 };
  });

  protected readonly geometry = computed(() => build(this.points(), this.type()));

  protected readonly ariaLabel = computed(() => {
    const g = this.geometry();
    const sectors = g && g.segments.length > 1 ? `, ${g.segments.length} sectors` : '';
    return `Outline of ${this.name() || 'the track'}${sectors}, start and finish marked`;
  });

  protected markFor(index: number): SectorMark | undefined {
    return this.marks()?.find((m) => m.index === index);
  }
}

function build(raw: TrackPoint[], type: TrackType) {
  if (!raw || raw.length < 2) return null;

  let pts = [...raw].sort((a, b) => a.seq - b.seq);
  const circuit = type === 'Circuit';

  // A circuit may be stored starting anywhere; draw it from its start line.
  const startAt = pts.findIndex((p) => p.isStartPoint);
  if (circuit && startAt > 0) pts = [...pts.slice(startAt), ...pts.slice(0, startAt)];

  // Equirectangular projection around the track's own latitude: exact enough at circuit scale.
  const lat0 = (pts.reduce((s, p) => s + p.latitude, 0) / pts.length) * (Math.PI / 180);
  const kx = Math.cos(lat0);
  const proj = pts.map((p) => ({ x: p.longitude * kx, y: -p.latitude }));

  const minX = Math.min(...proj.map((p) => p.x));
  const maxX = Math.max(...proj.map((p) => p.x));
  const minY = Math.min(...proj.map((p) => p.y));
  const maxY = Math.max(...proj.map((p) => p.y));
  const bw = Math.max(maxX - minX, 1e-9);
  const bh = Math.max(maxY - minY, 1e-9);
  const scale = Math.min((W - 2 * PAD) / bw, (MAX_H - 2 * PAD) / bh);
  const w = Math.round(bw * scale + 2 * PAD);
  const h = Math.round(bh * scale + 2 * PAD);

  const xy: Pt[] = proj.map((p) => ({ x: (p.x - minX) * scale + PAD, y: (p.y - minY) * scale + PAD }));
  const ring = circuit ? [...xy, xy[0]] : xy;

  const toD = (list: Pt[]) =>
    list.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');

  const centroid = {
    x: xy.reduce((s, p) => s + p.x, 0) / xy.length,
    y: xy.reduce((s, p) => s + p.y, 0) / xy.length,
  };

  // Sector boundaries, in running order.
  const cuts = pts
    .map((p, i) => ({ p, i }))
    .filter(({ p, i }) => p.isSectorPoint && i > 0)
    .map(({ i }) => i);
  const bounds = [0, ...cuts, ring.length - 1];

  const segments: Segment[] = [];
  for (let s = 0; s < bounds.length - 1; s++) {
    const slice = ring.slice(bounds[s], bounds[s + 1] + 1);
    if (slice.length < 2) continue;
    segments.push({ index: segments.length, d: toD(slice), ...calloutAt(slice, centroid, ring) });
  }

  // Start/finish chequer: perpendicular to the direction of travel at the start.
  const a = xy[0];
  const b = xy[1];
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const flag = `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${(angle + 90).toFixed(1)})`;

  let finishFlag: string | null = null;
  if (!circuit) {
    const z = xy[xy.length - 1];
    const y = xy[xy.length - 2];
    const fa = (Math.atan2(z.y - y.y, z.x - y.x) * 180) / Math.PI;
    finishFlag = `translate(${z.x.toFixed(1)} ${z.y.toFixed(1)}) rotate(${(fa + 90).toFixed(1)})`;
  }

  return { w, h, full: toD(ring), segments, flag, finishFlag, arrow: arrowAfterStart(ring, centroid) };
}

/**
 * The callout sits beside the sector's midpoint, on whichever side of the line leaves it the
 * most clearance from every other part of the outline, so it never lands on the track.
 */
function calloutAt(slice: Pt[], centroid: Pt, ring: Pt[]): Pick<Segment, 'label' | 'note' | 'anchor'> {
  const lengths = slice.slice(1).map((p, i) => Math.hypot(p.x - slice[i].x, p.y - slice[i].y));
  const half = lengths.reduce((s, l) => s + l, 0) / 2;
  let run = 0;
  let at = 0;
  let mid = slice[0];
  for (let i = 0; i < lengths.length; i++) {
    if (run + lengths[i] >= half) {
      const t = lengths[i] ? (half - run) / lengths[i] : 0;
      mid = { x: slice[i].x + (slice[i + 1].x - slice[i].x) * t, y: slice[i].y + (slice[i + 1].y - slice[i].y) * t };
      at = i;
      break;
    }
    run += lengths[i];
  }

  // Heading from a few points either side, so one kinked point cannot swing the normal.
  const a = slice[Math.max(0, at - 2)];
  const b = slice[Math.min(slice.length - 1, at + 3)];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const normal = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
  const outward = (mid.x - centroid.x) * normal.x + (mid.y - centroid.y) * normal.y >= 0 ? 1 : -1;

  const clearance = (p: Pt) => Math.min(...ring.map((q) => Math.hypot(q.x - p.x, q.y - p.y)));
  let best = { side: outward, dist: 46, score: -Infinity };
  for (const side of [outward, -outward]) {
    for (const dist of [46, 64]) {
      const p = { x: mid.x + normal.x * side * dist, y: mid.y + normal.y * side * dist };
      // Prefer the outside and the nearer spot unless they crowd the line.
      const score = Math.min(clearance(p), 40) - (side === outward ? 0 : 4) - (dist - 46) * 0.1;
      if (score > best.score) best = { side, dist, score };
    }
  }

  const ux = normal.x * best.side;
  const uy = normal.y * best.side;
  const label = { x: mid.x + ux * best.dist, y: mid.y + uy * best.dist };
  const note = { x: label.x + ux * 30, y: label.y + uy * 30 + (Math.abs(ux) < 0.5 ? Math.sign(uy || 1) * 10 : 0) };
  const anchor = ux > 0.35 ? 'start' : ux < -0.35 ? 'end' : 'middle';
  return { label, note, anchor };
}

/** A small arrowhead beside the line, a short way after the start, pointing the way cars run. */
function arrowAfterStart(ring: Pt[], centroid: Pt): string {
  let run = 0;
  let i = 0;
  while (i < ring.length - 2 && run < 70) {
    run += Math.hypot(ring[i + 1].x - ring[i].x, ring[i + 1].y - ring[i].y);
    i++;
  }
  const p = ring[i];
  const q = ring[Math.min(i + 1, ring.length - 1)];
  const ang = Math.atan2(q.y - p.y, q.x - p.x);
  // Offset to whichever side faces away from the centre, so it never sits inside the loop.
  let nx = -Math.sin(ang);
  let ny = Math.cos(ang);
  if ((p.x - centroid.x) * nx + (p.y - centroid.y) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const cx = p.x + nx * 26;
  const cy = p.y + ny * 26;
  const tip = { x: cx + Math.cos(ang) * 13, y: cy + Math.sin(ang) * 13 };
  const l = { x: cx - Math.cos(ang) * 9 + nx * 8, y: cy - Math.sin(ang) * 9 + ny * 8 };
  const r = { x: cx - Math.cos(ang) * 9 - nx * 8, y: cy - Math.sin(ang) * 9 - ny * 8 };
  return [tip, l, r].map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');
}
