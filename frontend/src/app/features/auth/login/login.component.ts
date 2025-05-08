import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    console.debug('Initiating login for:', this.email);
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.role !== 'CLIENT') {
          this.error = 'This page is for client login only';
          console.error('Invalid role:', res.role);
          return;
        }
        this.authService.setToken(res.token);
        this.error = null;
        console.debug('Login successful, navigating to dashboard');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.message || 'Login failed';
        console.error('Login error:', err);
      }
    });
  }

  goToRegister(event: Event) {
    event.preventDefault();
    this.router.navigate(['/register']);
  }

  goToResellerLogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/reseller-login']);
  }
}