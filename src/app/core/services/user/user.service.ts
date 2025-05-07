import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface BalanceChangeDto {
  amount: number;
}
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5021/api/Auth'; 

  constructor(private http: HttpClient) {}

  getUserProfile(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}`);
  }
  changeUserBalance(userId: string, dto: BalanceChangeDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/balance/change`, dto);
  }
 
}
