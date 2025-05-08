import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], // Added RouterModule
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss']
})
export class ClientDashboardComponent implements OnInit {
  userName: string = 'Loading...';
  userId: number = 0;
  activeOrders: number = 0;
  completedOrders: number = 0;
  resellersInCity: number = 0;
  recentOrders: any[] = [];
  today: Date = new Date();
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    // Prevent browser back button
    history.pushState(null, '', location.href);
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: Event) {
    history.pushState(null, '', location.href);
  }

  ngOnInit() {
    console.debug('Initializing dashboard');
    if (!this.authService.isLoggedIn()) {
      console.error('No token found, redirecting to login');
      this.router.navigate(['/']);
      return;
    }
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        console.log('User data:', user);
        this.userName = user?.name || 'Unknown User';
        this.userId = user?.id || 0;
        this.error = null;
        this.loadDashboardData(user?.city || '');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Profile error:', err);
        this.error = 'Failed to load profile data. Please try refreshing.';
        this.userName = 'Profile Error';
        this.loadDashboardData('');
      }
    });
  }

  loadDashboardData(city: string) {
    console.debug('Loading dashboard data, userId:', this.userId, 'city:', city);
    const fallbackUserId = this.userId || parseInt(localStorage.getItem('userId') || '0', 10);
    if (fallbackUserId) {
      this.http.get<any[]>(`/api/orders/client?clientId=${fallbackUserId}`).subscribe({
        next: (orders) => {
          console.debug('Orders fetched:', orders);
          this.activeOrders = orders.filter(o => o.status === 'PENDING').length;
          this.completedOrders = orders.filter(o => o.status === 'APPROVED').length;
          this.recentOrders = orders
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
        },
        error: (err) => {
          console.error('Error fetching orders:', err);
          this.error = 'Failed to load orders.';
        }
      });
    } else {
      console.warn('No user ID, skipping orders fetch');
    }

    if (city) {
      this.http.get<any[]>(`/api/users/resellers/${encodeURIComponent(city)}`).subscribe({
        next: (resellers) => {
          console.debug('Resellers fetched:', resellers);
          this.resellersInCity = resellers.length;
        },
        error: (err) => {
          console.error('Error fetching resellers:', err);
          this.error = 'Failed to load resellers.';
        }
      });
    } else {
      console.warn('No city, using fallback');
      this.http.get<any[]>(`/api/users/resellers/unknown`).subscribe({
        next: (resellers) => {
          console.debug('Fallback resellers fetched:', resellers);
          this.resellersInCity = resellers.length;
        },
        error: (err) => {
          console.error('Error fetching fallback resellers:', err);
          this.error = 'Failed to load resellers.';
        }
      });
    }
  }

  goToResellerLogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/reseller-login']);
  }

  logout() {
    console.debug('Logging out');
    this.authService.logout();
    this.router.navigate(['/']);
  }
}