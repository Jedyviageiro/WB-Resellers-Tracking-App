import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

interface UserProfile {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  city: string;
  phoneNumber: string;
  address: string | null;
}

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.scss']
})
export class ClientProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  isEditing: boolean = false;
  editedProfile: UserProfile | null = null;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.debug('Initializing ClientProfileComponent');
    if (!this.authService.isLoggedIn()) {
      console.error('Not logged in, redirecting to login');
      this.router.navigate(['/']);
      return;
    }

    this.loading = true;
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        console.debug('Profile fetched:', user);
        this.profile = {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          city: user.city,
          phoneNumber: user.phone,
          address: user.address
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Profile fetch error:', err);
        this.error = 'Failed to load profile. Please try again.';
        this.loading = false;
        if (err.status === 401) {
          console.debug('401 error, logging out');
          this.authService.logout();
          this.router.navigate(['/']);
        }
      }
    });
  }

  startEditing() {
    console.debug('Starting profile edit');
    this.isEditing = true;
    this.editedProfile = { ...this.profile! };
    this.error = null;
    this.successMessage = null;
  }

  saveProfile() {
    if (!this.editedProfile) return;

    const updates = {
      name: this.editedProfile.name,
      phone: this.editedProfile.phoneNumber,
      city: this.editedProfile.city,
      surname: this.editedProfile.surname || '',
      address: this.editedProfile.address || ''
    };

    console.debug('Saving profile with updates:', updates);
    this.loading = true;
    this.http.put('/api/users/client/profile', updates).subscribe({
      next: () => {
        console.debug('Profile updated successfully');
        this.profile = { ...this.editedProfile! };
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully!';
        this.error = null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Profile update error:', err);
        this.error = err.error || 'Failed to update profile.';
        this.loading = false;
      }
    });
  }

  cancelEditing() {
    console.debug('Cancelling profile edit');
    this.isEditing = false;
    this.editedProfile = null;
    this.error = null;
  }

  logout() {
    console.debug('Logging out');
    this.authService.logout();
    this.router.navigate(['/']);
  }
}