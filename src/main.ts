import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

// For whoever opens the devtools.
console.info(
  '%c🏁 Lights out. %cPurple sectors are self-reported here; be honest with the stopwatch.',
  'font: 800 14px system-ui; color: #17181a',
  'font: 400 12px system-ui; color: #45474c',
);
