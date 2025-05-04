import { Component, OnInit } from '@angular/core';
import { StripeService } from '../../core/services/payment/stripe.service';
import { PaymentService } from '../../core/services/payment/payment.service';
import { FormsModule } from '@angular/forms';
import {CommonModule} from '@angular/common'
import { loadStripe, Stripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  imports: [FormsModule,CommonModule],
})
export class PaymentComponent implements OnInit {
  amount = 0;
  message = '';
  loading = false;
  stripe!: Stripe;  

  constructor(
    private stripeSrv: StripeService,
    private paymentSrv: PaymentService
  ) {}

  async ngOnInit() {
    this.stripe = await this.stripeSrv.getStripe();
  }

  async pay() {
    if (this.amount <= 0) {
      this.message = 'Please enter a valid amount.';
      return;
    }
    this.loading = true;
    try {
      const sessionId = await this.paymentSrv.createCheckoutSession(this.amount * 100);
      const { error } = await this.stripe.redirectToCheckout({ sessionId });
      if (error) this.message = `Payment failed: ${error.message}`;
    } catch (err: any) {
      this.message = `Error: ${err.message}`;
    } finally {
      this.loading = false;
    }
  }
}
