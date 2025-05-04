// src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface SessionResponse { sessionId: string; }

@Injectable({ providedIn: 'root' })
export class PaymentService {
  apiUrl='http://localhost:5021/api/payment';

  constructor(private http: HttpClient) {}

  async createCheckoutSession(amountCents: number): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<SessionResponse>(
        `${this.apiUrl}/create-checkout-session`,
        { amount: amountCents }
      )
    );
    return res.sessionId;
  }
}
