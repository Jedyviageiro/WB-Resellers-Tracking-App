import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

interface Stock {
  id: number;
  quantity: number;
  price: string; // BigDecimal as string
  date: string; // LocalDate as string
}

@Component({
  selector: 'app-view-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './view-stock.component.html',
  styleUrls: ['./view-stock.component.scss']
})
export class ViewStockComponent implements OnInit {
  stock: Stock | null = null;
  currentItem: Stock | null = null;
  adjustmentQuantity: number = 0;
  adjustmentPrice: string = '';
  adjustmentReason: string = '';
  error: string | null = null;
  successMessage: string | null = null;
  userName: string = 'Unknown User';
  today: Date = new Date();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      console.error('Not logged in, redirecting to login');
      this.router.navigate(['/']);
      return;
    }

    this.authService.getUserProfile().subscribe({
      next: (user) => {
        if (user.role !== 'RESELLER') {
          this.error = 'Access denied: Reseller role required';
          setTimeout(() => {
            this.error = null;
            this.cdr.detectChanges();
          }, 3000);
          this.authService.logout();
          this.router.navigate(['/']);
          return;
        }
        this.userName = user.name || 'Unknown User';
        this.loadStock();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Profile fetch error:', err);
        this.error = `Failed to load profile: ${err.error?.message || err.message}`;
        setTimeout(() => {
          console.log('Clearing profile error');
          this.error = null;
          this.cdr.detectChanges();
        }, 3000);
        this.authService.logout();
        this.router.navigate(['/']);
      }
    });
  }

  loadStock() {
    this.error = null; // Clear error before request
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    this.http.get<Stock>('/api/stocks/stock', { headers }).subscribe({
      next: (stock) => {
        this.stock = stock;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Stock fetch error:', err);
        this.error = `Failed to load stock: ${err.error?.message || err.message}`;
        setTimeout(() => {
          console.log('Clearing load stock error');
          this.error = null;
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  showEditModal(item: Stock) {
    this.error = null; // Clear error when opening modal
    this.currentItem = { ...item };
    this.adjustmentQuantity = 0;
    this.adjustmentPrice = item.price;
    this.adjustmentReason = '';
    const modal = document.getElementById('editStockModal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
    this.currentItem = null;
  }

  updateStock() {
    if (!this.currentItem) return;

    if (!this.adjustmentReason.trim() || isNaN(this.adjustmentQuantity) || !this.isValidPrice(this.adjustmentPrice)) {
      this.error = 'Please fill in all fields correctly';
      setTimeout(() => {
        console.log('Clearing update stock validation error');
        this.error = null;
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    const newQuantity = this.currentItem.quantity + this.adjustmentQuantity;
    if (newQuantity < 0) {
      this.error = 'Stock quantity cannot be negative';
      setTimeout(() => {
        console.log('Clearing update stock quantity error');
        this.error = null;
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    this.error = null; // Clear error before request
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const body = {
      id: this.currentItem.id,
      quantity: newQuantity,
      price: this.adjustmentPrice
    };

    this.http.put<Stock>('/api/stocks/stock', body, { headers }).subscribe({
      next: (updatedStock) => {
        this.currentItem!.quantity = updatedStock.quantity;
        this.currentItem!.price = updatedStock.price;
        this.successMessage = 'Stock updated successfully';
        setTimeout(() => {
          console.log('Clearing update stock success');
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
        this.closeModals();
        this.loadStock();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Stock update error:', err);
        this.error = `Failed to update stock: ${err.error?.message || err.message}`;
        setTimeout(() => {
          console.log('Clearing update stock error');
          this.error = null;
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  isValidPrice(price: string): boolean {
    return /^\d+(\.\d{1,2})?$/.test(price);
  }

  getStockLevelLabel(quantity: number): string {
    if (quantity < 10) return 'Critical Stock Level';
    if (quantity < 30) return 'Low Stock Level';
    return 'Good Stock Level';
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}