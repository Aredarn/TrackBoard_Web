import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { load } from '../../core/load';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Gate } from '../../ui/gate';
import { PhotoFrame } from '../../ui/photo-frame';

@Component({
  selector: 'tb-garage-page',
  imports: [DecimalPipe, Gate, PhotoFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sheet-title title">Garage</h1>
    <p class="dim lede">Cars and their specs as TrackPro backed them up. Add or edit cars in the app.</p>

    <tb-gate [status]="cars.status()" [error]="cars.error()" [empty]="(cars.value()?.items?.length ?? 0) === 0" (retry)="cars.reload()">
      <div class="cars">
        @for (v of cars.value()?.items; track v.id) {
          <section class="car" [attr.aria-labelledby]="'car-' + v.id">
            <tb-photo [url]="v.photoUrl" [name]="v.manufacturer + ' ' + v.model" [size]="148" [alt]="'Photo of the ' + v.manufacturer + ' ' + v.model" />
            <div class="spec">
              <h2 [id]="'car-' + v.id">{{ v.manufacturer }} {{ v.model }} <span class="dim year">{{ v.year }}</span></h2>
              <dl>
                <div><dt>Engine</dt><dd>{{ v.engineType }}</dd></div>
                <div><dt>Power</dt><dd>{{ v.horsepower }} hp</dd></div>
                @if (v.torque) {
                  <div><dt>Torque</dt><dd>{{ v.torque }} Nm</dd></div>
                }
                <div><dt>Weight</dt><dd>{{ v.weight | number: '1.0-0' }} kg</dd></div>
                <div><dt>Drivetrain</dt><dd>{{ v.drivetrain }}</dd></div>
                <div><dt>Gearbox</dt><dd>{{ v.transmission }}</dd></div>
                <div><dt>Tyres</dt><dd>{{ v.tireType }}</dd></div>
                <div><dt>Fuel</dt><dd>{{ v.fuelType }}</dd></div>
                @if (v.acceleration) {
                  <div><dt>0–100 km/h</dt><dd>{{ v.acceleration | number: '1.1-1' }} s</dd></div>
                }
                @if (v.topSpeed) {
                  <div><dt>Top speed</dt><dd>{{ v.topSpeed | number: '1.0-0' }} km/h</dd></div>
                }
                @if (v.suspensionType) {
                  <div><dt>Suspension</dt><dd>{{ v.suspensionType }}</dd></div>
                }
              </dl>
            </div>
          </section>
        }
      </div>
      <p empty class="dim empty">No cars backed up yet. Cars you add in TrackPro appear here after the phone syncs.</p>
    </tb-gate>
  `,
  styles: `
    .title {
      margin-top: var(--s5);
    }

    .lede {
      margin: var(--s2) 0 var(--s5);
    }

    .cars {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 460px), 1fr));
      border-top: 2px solid var(--rule-strong);
    }

    .car {
      display: flex;
      gap: var(--s4);
      padding: var(--s5) var(--s4) var(--s5) 0;
      border-bottom: 1px solid var(--rule);
    }

    .spec {
      flex: 1;
      min-width: 0;
    }

    h2 {
      font-weight: 800;
      font-stretch: 108%;
      font-size: 1.25rem;
      line-height: 1.15;
    }

    .year {
      font-weight: 600;
    }

    dl {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px 16px;
      margin: var(--s3) 0 0;
    }

    dl div {
      display: flex;
      flex-direction: column-reverse;
    }

    dt {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-3);
    }

    dd {
      margin: 0;
      font-weight: 700;
      font-stretch: 90%;
    }

    .empty {
      padding-block: var(--s4);
    }

    @media (max-width: 520px) {
      .car {
        flex-direction: column;
      }
    }
  `,
})
export class GaragePage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  protected readonly cars = load({
    params: () => this.auth.user()?.id,
    stream: ({ params: ownerId }) => this.api.vehicles(ownerId),
  });
}
