import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth, user, User } from '@angular/fire/auth';
import { firstValueFrom, switchMap, take, Observable } from 'rxjs';

interface SessionResponse { sessionId: string; }

@Injectable({ providedIn: 'root' })
export class PaymentService {
  apiUrl='http://localhost:5021/api/payment';
  private user$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private auth: Auth) {
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

    async createCheckoutSession(amountCents: number): Promise<string> {
      const token = await firstValueFrom(this.getAuthToken());
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const res = await firstValueFrom(
        this.http.post<SessionResponse>(
          `${this.apiUrl}/create-checkout-session`,
          { amount: amountCents },
          { headers }
        )
      );
      return res.sessionId;
    }
}
