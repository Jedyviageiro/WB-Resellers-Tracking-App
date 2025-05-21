import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reseller-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reseller-login.component.html',
  styleUrls: ['./reseller-login.component.scss']
})
export class ResellerLoginComponent {
  email = '';
  password = '';
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.role === 'ADMIN') {
          this.authService.setToken(res.token);
          this.error = null;
          console.log('Admin login successful, navigating to admin dashboard');
          this.router.navigate(['/admin-dashboard']);
          return;
        }
        if (res.role !== 'RESELLER') {
          this.error = 'This page is for reseller login only';
          return;
        }
        this.authService.setToken(res.token);
        this.error = null;
        console.log('Reseller login successful, token:', res.token);
        this.router.navigate(['/reseller-dashboard']);
      },
      error: (err) => {
        this.error = err.error || 'Login failed';
        console.error('Login error:', err);
      }
    });
  }

  goToResellerRegister(event: Event) {
    event.preventDefault();
    this.router.navigate(['/reseller-register']);
  }

  goToClientLogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/']);
  }
}