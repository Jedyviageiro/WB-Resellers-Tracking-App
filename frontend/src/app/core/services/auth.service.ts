import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private cachedUser: any = null;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    console.debug('Attempting login for:', email);
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        console.debug('Login response:', res);
        this.cachedUser = null;

        const userId = res.id || res.user?.id;
        if (userId) {
          localStorage.setItem('userId', userId.toString());
          console.debug('Stored userId:', userId);
        }

        if (res.token) {
          this.setToken(res.token);
        }
      }),
      catchError(err => {
        console.error('Login error:', err);
        return throwError(() => new Error(err.error || 'Login failed'));
      })
    );
  }

  register(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, user);
  }

  confirm(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/confirm?token=${token}`);
  }

  getUserProfile(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('No token found'));
    }

    if (this.cachedUser) {
      console.debug('Returning cached user:', this.cachedUser);
      return of(this.cachedUser);
    }

    return this.http.get<any>('/api/users/client/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(user => {
        console.debug('Profile fetched:', user);
        this.cachedUser = user;

        if (user.id && !localStorage.getItem('userId')) {
          localStorage.setItem('userId', user.id.toString());
          console.debug('Recovered and stored userId from profile:', user.id);
        }
      }),
      catchError(err => {
        console.error('Profile fetch error:', err);
        return throwError(() => new Error('Failed to fetch profile'));
      })
    );
  }

  setToken(token: string) {
    console.debug('Setting token in localStorage:', token);
    localStorage.setItem('token', token);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    console.debug('Checking if logged in, token exists:', !!token);
    return !!token;
  }

  logout() {
    console.debug('Removing token and userId from localStorage');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    this.cachedUser = null;
  }
}
