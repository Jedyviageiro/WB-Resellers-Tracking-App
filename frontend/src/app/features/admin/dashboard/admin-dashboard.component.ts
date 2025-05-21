import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  city: string;
  address: string;
  role: string;
  enabled: boolean;
}

interface Stock {
  id: number;
  reseller: User;
  quantity: number;
  price: number;
  date: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  users: User[] = [];
  resellers: User[] = [];
  clients: User[] = [];
  userName: string = '';
  loading: boolean = true;
  error: string = '';
  success: string = '';
  today: Date = new Date();
  roleFilter: string = '';

  // Modal states
  showUserModal: boolean = false;
  selectedUser: User | null = null;
  showStockModal = false;
  showAddStockModal = false;
  stockQuantity = 0;
  stockPrice = 0;
  selectedReseller: User | null = null;
  editingUser: User | null = null;
  editingStock: Stock | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {
    history.pushState(null, '', location.href);
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      console.error('Not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user.role !== 'ADMIN') {
            console.error('Access denied: Admin role required');
            this.authService.logout();
            this.router.navigate(['/login']);
            return;
          }
          this.userName = `${user.name} ${user.surname}`;
          this.loadUsers();
        },
        error: (err) => {
          console.error('User profile fetch error:', err);
          this.error = 'Failed to load profile.';
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    try {
      const headers = this.getAuthHeaders();
      this.http.get<User[]>(`${environment.apiUrl}/api/users`, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (users) => {
            this.users = users.filter(user => user.role !== 'ADMIN');
            if (this.roleFilter) {
              this.users = users.filter(user => user.role === this.roleFilter);
            }
            this.resellers = users.filter(user => user.role === 'RESELLER');
            this.clients = users.filter(user => user.role === 'CLIENT');
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading users:', err);
            this.error = 'Failed to load users.';
            this.loading = false;
            if (err.status === 401) {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          }
        });
    } catch (error) {
      this.error = 'Authentication error';
      this.loading = false;
      this.router.navigate(['/login']);
    }
  }

  showUserDetails(user: User): void {
    this.selectedUser = user;
    this.editingUser = null;
    this.showUserModal = true;
  }

  editUser(user: User) {
    this.selectedUser = user;
    this.editingUser = { ...user };
    this.showUserModal = true;
  }

  saveUser() {
    if (!this.editingUser) return;

    try {
      const userData = {
        id: this.editingUser.id,
        name: this.editingUser.name,
        surname: this.editingUser.surname,
        email: this.editingUser.email,
        phoneNumber: this.editingUser.phoneNumber,
        address: this.editingUser.address,
        city: this.editingUser.city,
        enabled: this.editingUser.enabled,
        role: this.editingUser.role
      };

      const url = `${environment.apiUrl}/api/users/${this.editingUser.id}`;
      console.log('Updating user at URL:', url);
      console.log('User data:', userData);

      this.http.put<User>(url, userData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedUser) => {
            console.log('Update successful:', updatedUser);
            const index = this.users.findIndex(u => u.id === updatedUser.id);
            if (index !== -1) {
              this.users[index] = updatedUser;
            }
            this.success = 'User updated successfully';
            this.showUserModal = false;
            this.editingUser = null;
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error updating user:', err);
            console.error('Error details:', {
              status: err.status,
              message: err.error,
              url: err.url
            });
            this.error = err.error?.message || 'Failed to update user';
          }
        });
    } catch (error) {
      console.error('Exception in saveUser:', error);
      this.error = 'Error updating user';
    }
  }

  showStockDetails(user: User) {
    this.selectedReseller = user;
    this.loadStock(user.id);
    this.showStockModal = true;
  }

  loadStock(resellerId: number) {
    try {
      const headers = this.getAuthHeaders();
      console.log('Loading stock for reseller:', resellerId);
      
      // First, get the reseller's stock
      this.http.get<Stock>(`${environment.apiUrl}/api/stocks/reseller/${resellerId}`, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stock) => {
            console.log('Received stock data:', stock);
            if (stock) {
              this.editingStock = {
                id: stock.id || 0,
                reseller: this.selectedReseller!,
                quantity: stock.quantity || 0,
                price: stock.price || 0,
                date: stock.date || new Date().toISOString()
              };
              console.log('Set editing stock to:', this.editingStock);
            } else {
              // Initialize empty stock if none exists
              this.editingStock = {
                id: 0,
                reseller: this.selectedReseller!,
                quantity: 0,
                price: 0,
                date: new Date().toISOString()
              };
              console.log('Initialized empty stock:', this.editingStock);
            }
          },
          error: (err) => {
            console.error('Error loading stock:', err);
            this.error = err.error?.message || 'Failed to load stock';
            // Initialize empty stock on error
            this.editingStock = {
              id: 0,
              reseller: this.selectedReseller!,
              quantity: 0,
              price: 0,
              date: new Date().toISOString()
            };
          }
        });
    } catch (error) {
      console.error('Exception in loadStock:', error);
      this.error = 'Error loading stock';
      // Initialize empty stock on exception
      this.editingStock = {
        id: 0,
        reseller: this.selectedReseller!,
        quantity: 0,
        price: 0,
        date: new Date().toISOString()
      };
    }
  }

  saveStock() {
    if (!this.editingStock || !this.selectedReseller) return;

    try {
      const headers = this.getAuthHeaders();
      const stockData = {
        id: this.editingStock.id,
        quantity: this.editingStock.quantity,
        price: this.editingStock.price,
        resellerId: this.selectedReseller.id
      };
      console.log('Saving stock data:', stockData);

      const url = this.editingStock.id === 0 
        ? `${environment.apiUrl}/api/stocks`  // POST for new stock
        : `${environment.apiUrl}/api/stocks/stock`;  // PUT for existing stock

      const request = this.editingStock.id === 0
        ? this.http.post<Stock>(url, stockData, { headers })
        : this.http.put<Stock>(url, stockData, { headers });

      request.pipe(takeUntil(this.destroy$)).subscribe({
        next: (updatedStock) => {
          console.log('Stock saved successfully:', updatedStock);
          this.success = 'Stock updated successfully';
          this.loadStock(this.selectedReseller!.id);
        },
        error: (err) => {
          console.error('Error saving stock:', err);
          this.error = err.error?.message || 'Failed to save stock';
        }
      });
    } catch (error) {
      console.error('Exception in saveStock:', error);
      this.error = 'Error saving stock';
    }
  }

  addStock() {
    if (!this.selectedReseller) return;

    try {
      const headers = this.getAuthHeaders();
      const stockData = {
        quantity: this.stockQuantity,
        price: this.stockPrice,
        resellerId: this.selectedReseller.id
      };
      console.log('Adding stock data:', stockData);

      this.http.post<Stock>(`${environment.apiUrl}/api/stocks`, stockData, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newStock) => {
            console.log('Stock added successfully:', newStock);
            this.success = 'Stock added successfully';
            this.showAddStockModal = false;
            this.stockQuantity = 0;
            this.stockPrice = 0;
            this.loadStock(this.selectedReseller!.id);
          },
          error: (err) => {
            console.error('Error adding stock:', err);
            this.error = err.error?.message || 'Failed to add stock';
          }
        });
    } catch (error) {
      console.error('Exception in addStock:', error);
      this.error = 'Error adding stock';
    }
  }

  removeUser(user: User): void {
    if (confirm(`Are you sure you want to remove ${user.name}?`)) {
      try {
        const headers = this.getAuthHeaders();
        this.http.delete(`${environment.apiUrl}/api/users/${user.id}`, { headers }).subscribe({
          next: () => {
            this.success = 'User removed successfully';
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error removing user:', err);
            this.error = err.error?.message || 'Failed to remove user';
            if (err.status === 401) {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          }
        });
      } catch (error) {
        this.error = 'Authentication error';
        this.router.navigate(['/login']);
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  closeModal(): void {
    this.showUserModal = false;
    this.showStockModal = false;
    this.showAddStockModal = false;
    this.selectedUser = null;
    this.selectedReseller = null;
    this.editingUser = null;
    this.editingStock = null;
    this.error = '';
    this.success = '';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('Current token:', token);
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
} 