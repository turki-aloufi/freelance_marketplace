import { Routes } from '@angular/router';
import { SignInComponent } from './features/auth/sign-in/sign-in.component';
import { HomeComponent } from './features/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { SignUpComponent } from './features/auth/sign-up/sign-up.component';

export const routes: Routes = [
   { path: '', component: SignInComponent },
   { path: 'home', component: HomeComponent, canActivate: [authGuard] },
   { path: 'sign-in', component: SignInComponent },
   { path: 'sign-up', component: SignUpComponent },
   // { path: 'signup', component: SignupComponent },
];
