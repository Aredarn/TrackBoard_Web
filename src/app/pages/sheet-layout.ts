import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** The driver's own notebook, open on the board: My laps, Events, Me, Garage. */
@Component({
  selector: 'tb-sheet-layout',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet spiral file">
        <router-outlet />
      </article>
    </div>
  `,
  styles: `
    .file {
      min-height: 60vh;
    }
  `,
})
export class SheetLayout {}
