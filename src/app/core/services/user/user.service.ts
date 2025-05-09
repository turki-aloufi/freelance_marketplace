import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, switchMap, take, Observable } from 'rxjs';
import { Auth, user, User } from '@angular/fire/auth';

export interface BalanceChangeDto {
  amount: number;
}
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5021/api/Auth'; 
  private user$: Observable<User | null>;

  constructor(private http: HttpClient, private auth: Auth) {
    this.user$ = user(this.auth);

  }

    private getAuthToken(): Observable<string> {
        return this.user$.pipe(
          take(1),
          switchMap(user => {
            if (!user) throw new Error('No authenticated user');
            return user.getIdToken();
          })
        );
      }

  getUserProfile(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}`);
  }

  async updateBalance(amount: number): Promise<void> {
    const token = await firstValueFrom(this.getAuthToken());
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/balance/change`,
        { amount },
        { headers }
      )
    );
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }
  
 
}
