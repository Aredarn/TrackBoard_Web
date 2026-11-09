import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardVehicle } from '../core/api.types';
import { CarPipe } from './pipes';

/**
 * A car's name, linked to its public page when the board gave its id. Event boards leave the
 * id out, so there it stays plain text. The click doesn't reach the row, which may select it.
 */
@Component({
  selector: 'tb-car-link',
  imports: [RouterLink, CarPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vehicle()?.id; as id) {
      <a [routerLink]="['/cars', id]" (click)="$event.stopPropagation()">{{ vehicle() | car }}</a>
    } @else {
      {{ vehicle() | car }}
    }
  `,
})
export class CarLink {
  readonly vehicle = input<LeaderboardVehicle | null | undefined>();
}
