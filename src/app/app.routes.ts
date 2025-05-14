import { Routes } from '@angular/router';
import { SignInComponent } from './features/auth/sign-in/sign-in.component';
import { HomeComponent } from './features/home/home.component';
import { SignUpComponent } from './features/auth/sign-up/sign-up.component';
import { ClientProjectsComponent } from './features/client-projects/client-projects.component';
import { ClientApprovedProjectsComponent } from './features/client-approved-projects/client-approved-projects.component';
import { AddProjectComponent } from './features/add-project/add-project.component';
import { ProfileComponent } from './features/profile/profile.component';
import { EditProfileComponent } from './features/profile/edit-profile/edit-profile.component';
import { ProjectDetailComponent } from './features/project/project-detail/project-detail.component';
import { ClientProjectApprovedComponent } from './features/clientproject/client-project-approved/client-project-approved.component';
import { PaymentComponent } from './features/payment/payment.component';
import { MessagesComponent } from './features/chat/messages/messages.component';
import { MyWorkingProjectsComponent } from './features/MyWorkingProjects/my-working-projects/my-working-projects.component';
import { PaymentResultComponent } from './features/payment/payment-result/payment-result.component';
import { ProposalsComponent } from './features/MyProposals/my-proposals/my-proposals.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'messages', component: MessagesComponent, canActivate: [AuthGuard] },
  { path: 'client/projects', component: ClientProjectsComponent, canActivate: [AuthGuard] },
  { path: 'client/projects/add', component: AddProjectComponent, canActivate: [AuthGuard] },
  { path: 'client/projects/approved', component: ClientApprovedProjectsComponent, canActivate: [AuthGuard] },
  { path: 'payment', component: PaymentResultComponent, canActivate: [AuthGuard] },
  { path: 'profile/:id', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'profile/:id/edit', component: EditProfileComponent, canActivate: [AuthGuard] },
  { path: 'project-details/:id', component: ProjectDetailComponent, canActivate: [AuthGuard] },
  { path: 'clientProjects/approved', component: ClientProjectApprovedComponent, canActivate: [AuthGuard] },
  { path: 'my-proposals', component: ProposalsComponent, canActivate: [AuthGuard] },
  { path: 'workingin', component: MyWorkingProjectsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/home' },
];