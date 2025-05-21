import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Stock {
  id: number;
  quantity: number;
  price: number;
  resellerId: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = '/api/stocks';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  addStock(stock: Stock): Observable<Stock> {
    return this.http.post<Stock>(this.apiUrl, stock, {
      headers: this.getHeaders()
    });
  }

  getStocksByReseller(resellerId: number): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/reseller/${resellerId}`, {
      headers: this.getHeaders()
    });
  }
} 