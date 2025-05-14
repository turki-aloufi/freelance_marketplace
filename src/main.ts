import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

//Bugsnag
import Bugsnag from '@bugsnag/js';
Bugsnag.start({ apiKey: environment.bugsnagApiKey });
console.log('✅ Bugsnag has been started');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
