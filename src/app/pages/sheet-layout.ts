import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** One sheet on the board, for pages that are a single document: My laps, Events, Me, Garage. */
@Component({
  selector: 'tb-sheet-layout',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet file">
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
