import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

//Bugsnag
import Bugsnag from '@bugsnag/js';
Bugsnag.start({ apiKey: '57275aeb5e5f2cfbc08f4e8df830e4a8' });
console.log('✅ Bugsnag has been started');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
