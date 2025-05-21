import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ConfirmComponent } from './features/auth/confirm/confirm.component';
import { ResellerLoginComponent } from './features/auth/reseller-login/reseller-login.component';
import { ResellerRegisterComponent } from './features/auth/reseller-register/reseller-register.component';
import { ClientDashboardComponent } from './features/client/dashboard/client-dashboard.component';
import { FindResellersComponent } from './features/client/find-resellers/find-resellers.component';
import { ResellersListComponent } from './features/client/resellers-list/resellers-list.component';
import { ClientProfileComponent } from './features/client/profile/client-profile.component';
import { OrdersListComponent } from './features/client/orders-list/orders-list.component';
import { ResellerDashboardComponent } from './features/resellers/dashboard/reseller-dashboard.component';
import { ViewOrdersComponent } from './features/resellers/view-orders/view-orders.component';
import { ViewStockComponent } from './features/resellers/view-stock/view-stock.component';
import { ResellerProfileComponent } from './features/resellers/reseller-profile/reseller-profile.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { ViewInvoicesComponent } from './features/resellers/view-invoices/view-invoices.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'confirm', component: ConfirmComponent },
  { path: 'reseller-login', component: ResellerLoginComponent },
  { path: 'reseller-register', component: ResellerRegisterComponent },
  { path: 'dashboard', component: ClientDashboardComponent },
  { path: 'find-resellers', component: FindResellersComponent },
  { path: 'resellers-list', component: ResellersListComponent },
  { path: 'client-profile', component: ClientProfileComponent},
  { path: 'orders-list', component: OrdersListComponent},
  { path: 'reseller-dashboard', component: ResellerDashboardComponent},
  { path: 'view-orders', component: ViewOrdersComponent},
  { path: 'view-stock', component: ViewStockComponent},
  { path: 'reseller-profile', component: ResellerProfileComponent},
  { path: 'admin-dashboard', component: AdminDashboardComponent},
  { path: 'view-invoices', component: ViewInvoicesComponent},
  { path: '**', redirectTo: '' }
];