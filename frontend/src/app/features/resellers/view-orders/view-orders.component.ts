import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

interface Order {
  id: number;
  clientName: string;
  createdAt: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';
  pickupDate?: string;
  pickupCode?: string;
}

interface StockItem {
  id: number;
  name: string;
  quantity: number;
}

@Component({
  selector: 'app-view-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './view-orders.component.html',
  styleUrls: ['./view-orders.component.scss']
})
export class ViewOrdersComponent implements OnInit {
  orders: Order[] = [];
  stock: StockItem[] = [];
  currentOrder: Order | null = null;
  searchTerm: string = '';
  statusFilter: string = 'all';
  pickupDate: string = '';
  pickupCode: string = '';
  error: string | null = null;
  successMessage: string | null = null;
  userName: string = 'Unknown User';
  today: Date = new Date();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.authService.getUserProfile().subscribe({
      next: (user) => {
        if (user.role !== 'RESELLER') {
          this.error = 'Access denied: Reseller role required';
          this.authService.logout();
          this.router.navigate(['/']);
          return;
        }
        this.userName = user.name || 'Unknown User';
        this.loadOrders();
        this.loadStock();
      },
      error: (err) => {
        this.error = 'Failed to load profile';
        this.authService.logout();
        this.router.navigate(['/']);
      }
    });
  }

  loadOrders() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    this.http.get<Order[]>('/api/orders/reseller', { headers }).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.renderOrders();
      },
      error: (err) => {
        this.error = 'Failed to load orders';
      }
    });
  }

  loadStock() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    this.http.get<StockItem[]>('/api/stocks/stock', { headers }).subscribe({
      next: (stock) => {
        this.stock = Array.isArray(stock) ? stock : [];
      },
      error: (err) => {
        this.error = 'Failed to load stock';
        this.stock = [];
      }
    });
  }

  renderOrders() {
    const filteredOrders = this.orders.filter(order => {
      const matchesSearch = order.id.toString().includes(this.searchTerm.toLowerCase()) ||
                          order.clientName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || order.status.toLowerCase() === this.statusFilter;
      return matchesSearch && matchesStatus;
    });

    this.orders = filteredOrders;
  }

  showOrderModal(order: Order) {
    this.currentOrder = order;
    const modal = document.getElementById('orderModal');
    if (modal) {
      modal.classList.add('active');
    }

    // Update modal content
    const modalOrderId = document.getElementById('modalOrderId');
    const modalCustomer = document.getElementById('modalCustomer');
    const modalDate = document.getElementById('modalDate');
    const modalTotal = document.getElementById('modalTotal');
    const modalStatus = document.getElementById('modalStatus');
    
    if (modalOrderId) modalOrderId.textContent = order.id.toString();
    if (modalCustomer) modalCustomer.textContent = order.clientName;
    if (modalDate) modalDate.textContent = this.formatDate(order.createdAt);
    if (modalTotal) modalTotal.textContent = `${order.quantity} units`;
    if (modalStatus) modalStatus.textContent = order.status;

    const itemsContainer = document.getElementById('modalItems');
    if (itemsContainer) {
      itemsContainer.innerHTML = `<div class="item-tag">Water Bottle (${order.quantity})</div>`;
    }

    const stockWarning = document.getElementById('stockWarning');
    if (stockWarning) {
      if (Array.isArray(this.stock)) {
        const stockItem = this.stock.find(s => s.id === 1);
        const hasLowStock = stockItem && (stockItem.quantity - order.quantity < 10);
        stockWarning.style.display = hasLowStock ? 'flex' : 'none';
      } else {
        stockWarning.style.display = 'none';
      }
    }

    const approveButton = document.getElementById('approveButton') as HTMLButtonElement;
    const denyButton = document.getElementById('denyButton') as HTMLButtonElement;
    if (approveButton && denyButton) {
      const isPending = order.status === 'PENDING';
      approveButton.style.display = isPending ? 'flex' : 'none';
      denyButton.style.display = isPending ? 'flex' : 'none';
      approveButton.disabled = !isPending;
      denyButton.disabled = !isPending;
    }
  }

  showApprovalModal() {
    if (this.currentOrder?.status !== 'PENDING') {
      this.error = 'Cannot approve an already processed order';
      return;
    }
    const modal = document.getElementById('approvalModal');
    if (modal) {
      modal.classList.add('active');
    }

    const pickupDateInput = document.getElementById('pickupDate') as HTMLInputElement;
    if (pickupDateInput) {
      const today = new Date().toISOString().split('T')[0];
      pickupDateInput.min = today;
    }
  }

  closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
    this.error = null;
  }

  approveOrder() {
  if (!this.currentOrder || this.currentOrder.status !== 'PENDING') {
    this.error = 'Order cannot be approved';
    return;
  }

  if (!this.pickupDate || !this.pickupCode) {
    this.error = 'Please fill in all fields';
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.authService.getToken()}`
  });

  // Format date to match backend expectation (ISO string)
  const formattedDate = `${this.pickupDate}T00:00:00`;

  // Create URL with query parameters
  const url = `/api/orders/${this.currentOrder.id}/approve?pickupCode=${encodeURIComponent(this.pickupCode)}&pickupDate=${encodeURIComponent(formattedDate)}`;

  this.http.put(url, null, { headers }).subscribe({
    next: (updatedOrder: any) => {
      // Update local data
      this.currentOrder!.status = 'APPROVED';
      this.currentOrder!.pickupDate = this.pickupDate;
      this.currentOrder!.pickupCode = this.pickupCode;
      
      // Update stock locally
      if (Array.isArray(this.stock)) {
        const stockItem = this.stock.find(s => s.id === 1);
        if (stockItem) {
          stockItem.quantity -= this.currentOrder!.quantity;
        }
      }

      this.successMessage = 'Order approved successfully';
      setTimeout(() => this.successMessage = null, 3000);
      this.closeModals();
      this.pickupDate = '';
      this.pickupCode = '';
    },
    error: (err) => {
      this.error = 'Failed to approve order: ' + (err.error?.message || err.message);
    }
  });
}

denyOrder() {
  if (!this.currentOrder || this.currentOrder.status !== 'PENDING') {
    this.error = 'Cannot deny an already processed order';
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.authService.getToken()}`
  });

  this.http.put(`/api/orders/${this.currentOrder.id}/deny`, null, { headers }).subscribe({
    next: (updatedOrder: any) => {
      this.currentOrder!.status = 'DENIED';
      this.closeModals();
      this.successMessage = 'Order denied successfully';
      setTimeout(() => this.successMessage = null, 3000);
    },
    error: (err) => {
      this.error = 'Failed to deny order: ' + (err.error?.message || err.message);
    }
  });
}

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}