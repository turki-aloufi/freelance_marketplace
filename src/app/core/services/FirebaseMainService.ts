import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseMainService {
  app: FirebaseApp;

  constructor() {
    this.app = initializeApp(environment.firebaseMain, 'firebaseMainApp');
  }

  getApp() {
    return this.app;
  }
}
