import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

interface ResellerProfile {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

@Component({
  selector: 'app-reseller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reseller-profile.component.html',
  styleUrls: ['./reseller-profile.component.scss']
})
export class ResellerProfileComponent implements OnInit {
  profile: ResellerProfile | null = null;
  editProfile: Partial<ResellerProfile> = {};
  userName: string = 'Unknown User';
  today: Date = new Date('2025-05-19T07:56:00');
  error: string | null = null;
  successMessage: string | null = null;

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
            console.log('Clearing auth error');
            this.error = null;
            this.cdr.detectChanges();
          }, 3000);
          this.authService.logout();
          this.router.navigate(['/']);
          return;
        }
        this.userName = user.name ? `${user.name} ${user.surname || ''}`.trim() : 'Unknown User';
        this.loadProfile();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Auth profile fetch error:', err);
        this.error = `Failed to load auth profile: ${err.error?.message || err.message}`;
        setTimeout(() => {
          console.log('Clearing auth profile error');
          this.error = null;
          this.cdr.detectChanges();
        }, 3000);
        this.authService.logout();
        this.router.navigate(['/']);
      }
    });
  }

  loadProfile() {
    this.error = null;
    const token = this.authService.getToken();
    if (!token) {
      this.error = 'No authentication token found';
      setTimeout(() => {
        console.log('Clearing token error');
        this.error = null;
        this.cdr.detectChanges();
      }, 3000);
      this.authService.logout();
      this.router.navigate(['/']);
      return;
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.http.get<ResellerProfile>('/api/users/reseller/profile', { headers }).subscribe({
      next: (profile) => {
        console.log('Profile loaded:', profile);
        this.profile = profile;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Profile fetch error:', err);
        console.error('Response body:', err.error);
        this.error = `Failed to load profile: ${err.error?.message || err.message}`;
        setTimeout(() => {
          console.log('Clearing load profile error');
          this.error = null;
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  showEditModal() {
    this.error = null;
    if (this.profile) {
      this.editProfile = {
        name: this.profile.name,
        surname: this.profile.surname,
        email: this.profile.email,
        phone: this.profile.phone,
        address: this.profile.address,
        city: this.profile.city
      };
    }
    const modal = document.getElementById('editProfileModal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.editProfile = {};
  }

  updateProfile() {
    if (!this.validateProfileForm()) {
      this.error = 'Please fill in all fields correctly';
      setTimeout(() => {
        console.log('Clearing update profile validation error');
        this.error = null;
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    this.error = null;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    const body: { [key: string]: string } = {
      name: this.editProfile.name || '',
      surname: this.editProfile.surname || '',
      email: this.editProfile.email || '',
      phone: this.editProfile.phone || '',
      address: this.editProfile.address || '',
      city: this.editProfile.city || ''
    };

    this.http.put<ResellerProfile>('/api/users/reseller/profile', body, { headers }).subscribe({
      next: (updatedProfile) => {
        console.log('Profile updated:', updatedProfile);
        this.profile = updatedProfile;
        this.userName = `${updatedProfile.name} ${updatedProfile.surname || ''}`.trim();
        this.successMessage = 'Profile updated successfully';
        setTimeout(() => {
          console.log('Clearing update profile success');
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
        this.closeModal();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Profile update error:', err);
        console.error('Response body:', err.error);
        this.error = `Failed to update profile: ${err.error?.message || err.message}`;
        setTimeout(() => {
          console.log('Clearing update profile error');
          this.error = null;
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  validateProfileForm(): boolean {
    const p = this.editProfile;
    return !!p.name?.trim() &&
           !!p.surname?.trim() &&
           !!p.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) &&
           !!p.phone?.trim() && /^\+?\d{10,15}$/.test(p.phone.replace(/[\s-()]/g, '')) &&
           !!p.address?.trim() &&
           !!p.city?.trim();
  }

  getFullName(): string {
    return this.profile ? `${this.profile.name} ${this.profile.surname || ''}`.trim() : 'Unknown User';
  }

  getFullAddress(): string {
    if (!this.profile) return 'Not set';
    const parts = [this.profile.address, this.profile.city].filter(part => part);
    return parts.length ? parts.join(', ') : 'Not set';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}