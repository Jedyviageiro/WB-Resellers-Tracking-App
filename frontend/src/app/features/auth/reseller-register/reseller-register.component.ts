import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reseller-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reseller-register.component.html',
  styleUrls: ['./reseller-register.component.scss']
})
export class ResellerRegisterComponent {
  name = '';
  surname = '';
  email = '';
  password = '';
  repeatPassword = '';
  city = '';
  phoneNumber = '';
  address = '';
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
      name: this.name,
      surname: this.surname,
      email: this.email,
      password: this.password,
      city: this.city,
      phoneNumber: this.phoneNumber,
      address: this.address,
      role: 'RESELLER'
    };

    this.authService.register(user).subscribe({
      next: (response) => {
        this.error = null;
        this.success = 'Registration successful! Please check your email to confirm your account.';
        console.log('Reseller registration successful:', response);
      },
      error: (err) => {
        const errorMessage = err.error || 'Registration failed';
        this.error = errorMessage.includes('Email already in use') ? 'Email already in use' : 'Registration failed';
        this.success = null;
        console.error('Registration error:', err);
      }
    });
  }

  goToResellerLogin() {
    this.router.navigate(['/reseller-login']);
  }

  goToClientLogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/']);
  }
}