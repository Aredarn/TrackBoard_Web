import { Pipe, PipeTransform } from '@angular/core';
import { GpsSource, LeaderboardVehicle } from '../core/api.types';
import { date, dateTime, gap, gpsLabel, lapTime, lengthKm, vehicleName } from '../core/format';

@Pipe({ name: 'lap' })
export class LapPipe implements PipeTransform {
  transform(ms: number | null | undefined): string {
    return lapTime(ms);
  }
}

@Pipe({ name: 'gap' })
export class GapPipe implements PipeTransform {
  transform(ms: number | null | undefined, zero = ''): string {
    return gap(ms) ?? zero;
  }
}

@Pipe({ name: 'km' })
export class KmPipe implements PipeTransform {
  transform(meters: number | null | undefined): string {
    return lengthKm(meters);
  }
}

@Pipe({ name: 'day' })
export class DayPipe implements PipeTransform {
  transform(iso: string | null | undefined, withTime = false): string {
    return withTime ? dateTime(iso) : date(iso);
  }
}

@Pipe({ name: 'gps' })
export class GpsPipe implements PipeTransform {
  transform(source: GpsSource): string {
    return gpsLabel(source);
  }
}

@Pipe({ name: 'car' })
export class CarPipe implements PipeTransform {
  transform(v: LeaderboardVehicle | null | undefined): string {
    return vehicleName(v);
  }
}

export const TIMING_PIPES = [LapPipe, GapPipe, KmPipe, DayPipe, GpsPipe, CarPipe] as const;
