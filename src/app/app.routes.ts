import { Routes } from '@angular/router';
import { SignInComponent } from './features/auth/sign-in/sign-in.component';
import { HomeComponent } from './features/home/home.component';
import { SignUpComponent } from './features/auth/sign-up/sign-up.component';
import {ProjectDetailComponent} from './features/project/project-detail/project-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'project-details/:id', component: ProjectDetailComponent },
  { path: '**', redirectTo: '/home' },
 
];
