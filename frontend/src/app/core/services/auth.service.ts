import { Injectable } from '@angular/core';
   import { HttpClient, HttpHeaders } from '@angular/common/http';
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

           const userId = res.id;
           if (userId) {
             localStorage.setItem('userId', userId.toString());
             console.debug('Stored userId:', userId);
           }

           if (res.token) {
             this.setToken(res.token);
           }
         }),
         catchError(err => {
           console.error('Login error:', err.status, err.error);
           return throwError(() => new Error(err.error?.message || 'Login failed'));
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

       const headers = new HttpHeaders({
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       });

       console.debug('Fetching user profile with token:', token.substring(0, 10) + '...');
       return this.http.get<any>(`${this.apiUrl}/profile`, { headers }).pipe(
         tap(user => {
           console.debug('Profile fetched:', user);
           this.cachedUser = user;
           if (user.id && !localStorage.getItem('userId')) {
             localStorage.setItem('userId', user.id.toString());
             console.debug('Stored userId from profile:', user.id);
           }
         }),
         catchError(err => {
           console.error('Profile fetch error:', err.status, err.error);
           return throwError(() => new Error('Failed to fetch profile'));
         })
       );
     }

     getToken(): string | null {
       const token = localStorage.getItem('token');
       console.debug('Getting token:', token ? token.substring(0, 10) + '...' : 'null');
       return token;
     }

     setToken(token: string) {
       console.debug('Setting token in localStorage:', token.substring(0, 10) + '...');
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

     generateCrossAppToken(): Observable<{ token: string }> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return throwError(() => new Error('No token available'));
    }

    // Create a slightly modified version of the token for cross-app use
    const crossAppToken = currentToken + '.crossapp'; // Simple marker
    return of({ token: crossAppToken });
  }
   }