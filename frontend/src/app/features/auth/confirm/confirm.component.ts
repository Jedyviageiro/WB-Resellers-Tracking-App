import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {
  message: string | null = null;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.confirm(token).subscribe({
        next: () => {
          this.message = 'Email confirmed successfully! Redirecting to login...';
          this.error = null;
          setTimeout(() => this.router.navigate(['/']), 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Confirmation failed. Invalid or expired token.';
          this.message = null;
          console.error('Confirmation error:', err);
        }
      });
    } else {
      this.error = 'Invalid confirmation link';
      this.message = null;
    }
  }
}