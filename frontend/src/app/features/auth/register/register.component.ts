import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  name = '';
  surname = '';
  email = '';
  password = '';
  repeatPassword = '';
  city = '';
  phoneNumber = '';
  error: string | null = null;
  success: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    if (this.password !== this.repeatPassword) {
      this.error = 'Passwords don’t match, try again';
      this.success = null;
      return;
    }

    const user = {
      name: this.name + ' ' + this.surname,
      email: this.email,
      password: this.password,
      city: this.city,
      phoneNumber: this.phoneNumber,
      role: 'CLIENT'
    };

    this.authService.register(user).subscribe({
      next: (response) => {
        this.error = null;
        this.success = 'Registration successful! Please check your email to confirm your account.';
        console.log('Client registration successful:', response);
      },
      error: (err) => {
        const errorMessage = err.error || 'Registration failed';
        this.error = errorMessage.includes('Email already in use') ? 'Email already in use' : 'Registration failed';
        this.success = null;
        console.error('Registration error:', err);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/']);
  }

  goToResellerLogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/reseller-login']);
  }
}