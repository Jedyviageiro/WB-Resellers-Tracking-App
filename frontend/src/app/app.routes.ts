import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ConfirmComponent } from './features/auth/confirm/confirm.component';
import { ResellerLoginComponent } from './features/auth/reseller-login/reseller-login.component';
import { ResellerRegisterComponent } from './features/auth/reseller-register/reseller-register.component';
import { ClientDashboardComponent } from './features/client/dashboard/client-dashboard.component';
import { FindResellersComponent } from './features/client/find-resellers/find-resellers.component';
import { ResellersListComponent } from './features/client/resellers-list/resellers-list.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'confirm', component: ConfirmComponent },
  { path: 'reseller-login', component: ResellerLoginComponent },
  { path: 'reseller-register', component: ResellerRegisterComponent },
  { path: 'dashboard', component: ClientDashboardComponent },
  { path: 'find-resellers', component: FindResellersComponent },
  { path: 'resellers-list', component: ResellersListComponent },
  { path: '**', redirectTo: '' }
];