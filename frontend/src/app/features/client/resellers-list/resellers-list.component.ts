import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

interface Reseller {
  id: string;
  name: string;
  surname: string;
  email: string;
  city: string;
  phoneNumber: string;
  address: string;
  availableBottles: number;
  pricePerBottle: number;
  latestOrderRequestDate?: string;
  orderRequestCount?: number;
  status?: string;
}

@Component({
  selector: 'app-resellers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './resellers-list.component.html',
  styleUrls: ['./resellers-list.component.scss']
})
export class ResellersListComponent implements OnInit {
  resellers: Reseller[] = [];
  filteredResellers: Reseller[] = [];
  searchQuery: string = '';
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  userCity: string = '';
  userId: number | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        this.userId = user?.id || null;
        this.userCity = user?.city || '';
        console.debug('User profile:', { id: this.userId, city: this.userCity });

        if (!this.userCity) {
          this.error = 'User city not available.';
          this.loading = false;
          return;
        }
        this.fetchResellers(this.userCity);
      },
      error: (err) => {
        console.error('Profile fetch error:', err);
        this.error = 'Failed to load user profile.';
        this.loading = false;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  fetchResellers(city: string) {
    this.http.get<any[]>(`/api/users/resellers/${encodeURIComponent(city)}`).subscribe({
      next: (resellers) => {
        console.debug('Raw resellers response:', resellers);
        const stockRequests = resellers.map(reseller =>
          this.http.get<any>(`/api/stocks/reseller/${reseller.id}`)
        );
        
        forkJoin(stockRequests).subscribe({
          next: (stocks) => {
            this.resellers = resellers.map((reseller, index) => {
              const stock = stocks[index] || {};
              const latestOrderDate = reseller.latestOrderRequestDate ? new Date(reseller.latestOrderRequestDate) : null;
              const orderCount = reseller.orderRequestCount ?? 0;
              let status: string;
              if (orderCount < 5) {
                status = 'New';
              } else {
                const fiveDaysAgo = new Date();
                fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
                status = latestOrderDate && latestOrderDate > fiveDaysAgo ? 'Active' : 'Inactive';
              }
              return {
                ...reseller,
                availableBottles: stock.quantity ?? 0,
                pricePerBottle: stock.price ?? 0,
                status
              };
            });
            this.filteredResellers = this.resellers;
            this.loading = false;
            if (!resellers.length) {
              this.error = 'No resellers found in your city.';
            }
            console.debug('Mapped resellers with stock:', this.resellers);
          },
          error: (err) => {
            console.error('Stock fetch error:', err);
            this.error = 'Failed to fetch stock information for resellers.';
            this.loading = false;
            if (err.status === 401) {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          }
        });
      },
      error: (err) => {
        console.error('Resellers fetch error:', err);
        this.error = 'Failed to load resellers.';
        this.loading = false;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  searchResellers() {
    this.error = null;
    this.loading = true;

    if (!this.searchQuery.trim()) {
      this.filteredResellers = this.resellers;
      this.loading = false;
      return;
    }

    const query = this.searchQuery.toLowerCase();

    if (query !== this.userCity.toLowerCase()) {
      this.http.get<any[]>(`/api/users/resellers/${encodeURIComponent(query)}`).subscribe({
        next: (resellers) => {
          this.loading = false;
          if (resellers.length === 0) {
            this.error = 'No resellers found for this city.';
            this.filteredResellers = [];
            return;
          }
          this.error = 'You can only view resellers in your city.';
          this.filteredResellers = [];
        },
        error: (err) => {
          this.loading = false;
          this.error = 'No resellers found for this city.';
          this.filteredResellers = [];
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
    } else {
      this.filteredResellers = this.resellers.filter(reseller =>
        `${reseller.name} ${reseller.surname}`.toLowerCase().includes(query) ||
        reseller.city.toLowerCase().includes(query)
      );
      this.loading = false;
      if (!this.filteredResellers.length) {
        this.error = 'No resellers found for this search.';
      }
    }
  }

  placeOrder(reseller: Reseller) {
    if (!this.authService.isLoggedIn()) {
      console.debug('Not logged in, redirecting to login');
      this.error = 'Please login to place an order.';
      this.router.navigate(['/login']);
      return;
    }

    if (!this.userId) {
      console.debug('User ID missing');
      this.error = 'User not authenticated.';
      this.loading = false;
      return;
    }

    console.debug('Placing order for reseller:', reseller.id, 'by user:', this.userId);
    this.loading = true;
    
    forkJoin([
      this.http.get<any>(`/api/stocks/reseller/${reseller.id}`),
      this.http.get<any>(`/api/users/${this.userId}`),
      this.http.get<any>(`/api/users/${reseller.id}`)
    ]).subscribe({
      next: ([stock, client, resellerUser]) => {
        console.debug('Fetched data:', { stock, client, resellerUser });
        const availableBottles = stock?.quantity || 0;
        const pricePerBottle = stock?.price || 0;

        const quantity = prompt(`Enter number of bottles to order (Available: ${availableBottles}):`, '1');
        
        if (!quantity || isNaN(+quantity) || +quantity <= 0) {
          console.debug('Invalid quantity:', quantity);
          this.error = 'Invalid quantity entered.';
          this.loading = false;
          return;
        }

        if (+quantity > availableBottles) {
          console.debug('Quantity exceeds stock:', quantity, availableBottles);
          this.error = `Requested quantity (${quantity}) exceeds available stock (${availableBottles}).`;
          this.loading = false;
          return;
        }

        const order = {
          client: client,
          reseller: resellerUser,
          quantity: +quantity,
          pricePerBottle: pricePerBottle,
          totalPrice: +quantity * pricePerBottle
        };

        console.debug('Submitting order:', order);
        this.http.post('/api/orders', order).subscribe({
          next: () => {
            console.debug('Order placed successfully');
            this.successMessage = 'Order placed successfully!';
            this.error = null;
            this.loading = false;
            
            this.fetchResellers(this.userCity);
            
            //setTimeout(() => {
              //this.router.navigate(['/client-dashboard'], {
               // state: { successMessage: 'Order placed successfully! Please wait for the reseller\'s response.' }
             // });
           // }, 2000);
          },
          error: (err) => {
            console.error('Order placement failed:', err);
            this.error = err.error?.message || 'Failed to place order.';
            this.loading = false;
            if (err.status === 401) {
              console.debug('401 error on order placement, logging out');
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          }
        });
      },
      error: (err) => {
        console.error('Data fetch error:', err);
        this.error = err.error?.message || 'Failed to fetch required information.';
        this.loading = false;
        if (err.status === 401) {
          console.debug('401 error on data fetch, logging out');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}