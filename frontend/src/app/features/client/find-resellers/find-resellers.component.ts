import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-find-resellers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './find-resellers.component.html',
  styleUrls: ['./find-resellers.component.scss']
})
export class FindResellersComponent implements OnInit {
  searchQuery: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  userCity: string = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        this.userCity = user?.city || '';
        console.debug('User city:', this.userCity);
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.error = 'Failed to load user profile.';
      }
    });
  }

  searchResellers() {
    if (!this.searchQuery.trim()) {
      this.error = 'Please enter a city.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Check if city exists in the database
    this.http.get<any[]>(`/api/users/resellers/${encodeURIComponent(this.searchQuery)}`).subscribe({
      next: (resellers) => {
        this.isLoading = false;
        if (resellers.length === 0) {
          this.error = 'There are no resellers in this location in our system.';
          return;
        }

        // Check if searched city matches user's city
        if (this.searchQuery.toLowerCase() !== this.userCity.toLowerCase()) {
          this.error = 'The city you entered is far away from yours, you cant order from resellers in other cities.';
          return;
        }

        // Success: Navigate to resellers list with resellers data
        this.router.navigate(['/resellers-list'], {
          state: { resellers, city: this.searchQuery }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error fetching resellers:', err);
        this.error = 'The city doesnt exist in our system.';
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}