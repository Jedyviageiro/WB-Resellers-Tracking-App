import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Order {
  id: number;
  pickupDate: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';
  quantity: number;
  clientName: string;
  createdAt: string;
  deliveryAddress: string;
}

interface Stock {
  id: number;
  quantity: number;
  lastUpdated: string;
}

interface Activity {
  id: number;
  type: 'order' | 'stock' | 'alert';
  title: string;
  time: string;
  icon: string;
}

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  icon: string;
}

@Component({
  selector: 'app-reseller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reseller-dashboard.component.html',
  styleUrls: ['./reseller-dashboard.component.scss']
})
export class ResellerDashboardComponent implements OnInit, AfterViewInit {
  resellerName: string | null = null;
  resellerType: string = 'Premium Reseller';
  orders: Order[] = [];
  stock: Stock | null = null;
  stats: StatCard[] = [];
  activities: Activity[] = [];
  loading: boolean = true;
  error: string | null = null;
  chart: Chart | null = null;
  chartPeriod: string = 'week';
  invoiceSystemUrl: string = 'http://localhost:3001';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    history.pushState(null, '', location.href);
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: Event) {
    history.pushState(null, '', location.href);
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      console.error('Not logged in, redirecting to login');
      this.router.navigate(['/reseller-login']);
      return;
    }

    this.authService.getUserProfile().subscribe({
      next: (user) => {
        if (user.role !== 'RESELLER') {
          console.error('Access denied: Reseller role required');
          this.authService.logout();
          this.router.navigate(['/reseller-login']);
          return;
        }
        this.resellerName = user.name;
        console.debug('Reseller:', this.resellerName);
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('User profile fetch error:', err);
        this.error = 'Failed to load profile.';
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/reseller-login']);
        }
      }
    });

    this.setCurrentDate();
  }

  ngAfterViewInit() {
    this.initializeChart();
  }

  loadDashboardData() {
    this.loading = true;
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    this.http.get<Order[]>('/api/orders/reseller', { headers }).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.http.get<Stock>('/api/stocks/stock', { headers }).subscribe({
          next: (stock) => {
            this.stock = stock;
            this.calculateStats();
            this.generateActivities();
            this.loading = false;
          },
          error: (err) => {
            console.error('Stock fetch error:', err);
            this.error = 'Failed to load stock.';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Orders fetch error:', err);
        this.error = 'Failed to load orders.';
        this.loading = false;
      }
    });
  }

  calculateStats() {
    const totalOrders = this.orders.length;
    const revenue = this.orders
      .filter(o => o.status === 'APPROVED')
      .reduce((sum, o) => sum + o.quantity * 180, 0);
    const stockItems = this.stock?.quantity || 0;

    this.stats = [
      { title: 'Total Orders', value: totalOrders, change: 12.5, icon: 'fas fa-shopping-cart' },
      { title: 'Revenue', value: `$${revenue.toLocaleString()}`, change: 8.2, icon: 'fas fa-dollar-sign' },
      { title: 'Stock Items', value: stockItems, change: -2.4, icon: 'fas fa-boxes' },
    ];
  }

  generateActivities() {
    this.activities = this.orders
      .filter(o => o.status === 'PENDING')
      .slice(0, 3)
      .map((o, i) => ({
        id: o.id,
        type: 'order' as const,
        title: `New order #${o.id} from ${o.clientName}`,
        time: this.formatTime(o.createdAt),
        icon: 'fas fa-shopping-cart'
      }));

    if (this.stock && this.stock.quantity < 100) {
      this.activities.push({
        id: 999,
        type: 'stock',
        title: 'Stock level low',
        time: this.formatTime(this.stock.lastUpdated),
        icon: 'fas fa-box'
      });
    }
  }

  initializeChart() {
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Chart canvas not found');
      return;
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Orders',
          data: this.getChartData('week'),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  updateChartFilter(period: string) {
    this.chartPeriod = period;
    if (!this.chart) return;
    this.chart.data.labels = this.getChartLabels(period);
    this.chart.data.datasets[0].data = this.getChartData(period);
    this.chart.update();
  }

  getChartLabels(period: string): string[] {
    switch (period) {
      case 'month': return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case 'year': return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      default: return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
  }

  getChartData(period: string): number[] {
    switch (period) {
      case 'month': return [65, 59, 80, 81];
      case 'year': return [65, 59, 80, 81, 56, 55, 40, 45, 60, 70, 75, 80];
      default: return [12, 19, 15, 17, 22, 25, 20];
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000 / 60;
    if (diff < 60) return `${Math.round(diff)} minutes ago`;
    if (diff < 1440) return `${Math.round(diff / 60)} hours ago`;
    return this.formatDate(dateString);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleString('en-US', options);
    } catch (e) {
      console.error('Date format error:', e);
      return dateString;
    }
  }

  setCurrentDate() {
    const dateDisplay = document.getElementById('currentDate');
    if (dateDisplay) {
      dateDisplay.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  getAbsValue(value: number): number {
    return Math.abs(value);
  }

  goToInvoiceDashboard() {
    window.location.href = this.invoiceSystemUrl;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/reseller-login']);
  }
}