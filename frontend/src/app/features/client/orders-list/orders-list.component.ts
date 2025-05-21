import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ArrayFromNumberPipe } from '../../../core/pipes/array-from-number.pipe';

interface Order {
  id: number;
  pickupDate: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';
  quantity: number;
  resellerName: string;
  deliveryAddress: string;
  resellerId: number;
    createdAt: string;  // Add this line
}

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ArrayFromNumberPipe],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  paginatedOrders: Order[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  searchTerm: string = '';
  statusFilter: string = 'all';
  loading: boolean = false;
  error: string | null = null;
  userId: number | null = null;
  userEmail: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    console.debug('Initializing OrdersListComponent');
    if (!this.authService.isLoggedIn()) {
      console.error('Not logged in, redirecting to login');
      this.router.navigate(['/']);
      return;
    }

    this.authService.getUserProfile().subscribe({
      next: (user) => {
        this.userId = user.id;
        this.userEmail = user.email;
        console.debug('User ID:', this.userId, 'Email:', this.userEmail);
        this.loadOrders();
      },
      error: (err) => {
        console.error('User profile fetch error:', err);
        this.error = 'Failed to load user profile.';
        if (err.status === 401) {
          console.debug('401 error, logging out');
          this.authService.logout();
          this.router.navigate(['/']);
        }
      }
    });
  }

  loadOrders() {
    const fallbackUserId = this.userId || parseInt(localStorage.getItem('userId') || '0', 10);
    if (!fallbackUserId) {
      this.error = 'User ID not found.';
      this.loading = false;
      return;
    }

    this.loading = true;
    console.debug('Fetching orders for clientId:', fallbackUserId);
    this.http.get<Order[]>(`/api/orders/client?clientId=${fallbackUserId}`).subscribe({
      next: (orders) => {
        console.debug('Orders fetched successfully:', orders);
        this.orders = orders;
        this.filterOrders();
        this.loading = false;
      },
      error: (err) => {
        console.error('Orders fetch error:', err);
        this.error = `Failed to load orders: ${err.status} ${err.statusText}`;
        this.loading = false;
      }
    });
  }

  filterOrders() {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = 
        order.id.toString().toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.deliveryAddress.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.resellerName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || order.status.toLowerCase() === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
    this.currentPage = 1;
    this.paginateOrders();
  }

  paginateOrders() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  cancelOrder(orderId: number) {
    if (!this.userEmail) {
      this.error = 'User email not found.';
      console.error('Cancel order failed: No user email');
      return;
    }
    console.debug('Cancelling order:', orderId, 'with email:', this.userEmail);
    this.http.put(`/api/orders/${orderId}/cancel?email=${encodeURIComponent(this.userEmail)}`, {}).subscribe({
      next: () => {
        console.debug('Order cancelled:', orderId);
        this.loadOrders(); // Refresh orders
      },
      error: (err) => {
        console.error('Cancel order error:', err);
        this.error = `Failed to cancel order: ${err.status} ${err.error || err.statusText}`;
      }
    });
  }

  onSearchChange() {
    this.filterOrders();
  }

  onStatusFilterChange() {
    this.filterOrders();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateOrders();
    }
  }

  nextPage() {
    const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.paginateOrders();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.paginateOrders();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleString('en-US', options);
    } catch (e) {
      console.error('Date format error:', e, 'Input:', dateString);
      return dateString;
    }
  }

  capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  logout() {
    console.debug('Logging out');
    this.authService.logout();
    this.router.navigate(['/']);
  }

  
}