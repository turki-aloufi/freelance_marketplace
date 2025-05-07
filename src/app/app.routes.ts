import { Routes } from '@angular/router';
import { SignInComponent } from './features/auth/sign-in/sign-in.component';
import { HomeComponent } from './features/home/home.component';
import { SignUpComponent } from './features/auth/sign-up/sign-up.component';
import { ClientProjectsComponent } from './features/client-projects/client-projects.component';
import { ClientApprovedProjectsComponent } from './features/client-approved-projects/client-approved-projects.component';
import { AddProjectComponent } from './features/add-project/add-project.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'client/projects', component: ClientProjectsComponent },
  { path: 'client/projects/add', component: AddProjectComponent },
  { path: 'client/projects/approved', component: ClientApprovedProjectsComponent },
  { path: '**', redirectTo: '/home' },
];
