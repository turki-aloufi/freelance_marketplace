import { Routes } from '@angular/router';
import { SignInComponent } from './features/auth/sign-in/sign-in.component';
import { HomeComponent } from './features/home/home.component';
import { SignUpComponent } from './features/auth/sign-up/sign-up.component';

import { ProfileComponent } from './features/profile/profile.component';

import {ProjectDetailComponent} from './features/project/project-detail/project-detail.component';
import { ClientProjectApprovedComponent } from './features/clientproject/client-project-approved/client-project-approved.component';
import { PaymentComponent } from './features/payment/payment.component';
import { MyWorkingProjectsComponent } from './features/MyWorkingProjects/my-working-projects/my-working-projects.component';



export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: SignUpComponent },

  { path: 'profile/:id',component: ProfileComponent },

  { path: 'project-details/:id', component: ProjectDetailComponent },
  { path: 'clientProjects/approved', component: ClientProjectApprovedComponent },

  { path: 'workingin', component: MyWorkingProjectsComponent},

  { path: '**', redirectTo: '/home' },
 


];
