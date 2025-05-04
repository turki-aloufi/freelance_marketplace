import { Routes } from '@angular/router';
import { SignInComponent } from './features/auth/sign-in/sign-in.component';
import { HomeComponent } from './features/home/home.component';
import { SignUpComponent } from './features/auth/sign-up/sign-up.component';
import { ClientProjectApprovedComponent } from './features/clientproject/client-project-approved/client-project-approved.component';
import { PaymentComponent } from './features/payment/payment.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'clientProjects/approved', component: ClientProjectApprovedComponent },
  { path: 'payment', component: PaymentComponent },
  { path: '**', redirectTo: '/home' },

];
