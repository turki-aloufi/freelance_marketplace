import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { UserService } from '../../../core/services/user/user.service'; 

@Component({
  selector: 'app-payment-result',
  imports: [],
  templateUrl: './payment-result.component.html',
  styleUrl: './payment-result.component.css'
})
export class PaymentResultComponent implements OnInit {
result="falids";
  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private userSrv: UserService,
  ) { }
  ngOnInit() {
      // call update balance API when redicrect from strip 
      this.route.queryParams.subscribe(async params => {
        if (params['success'] === 'true' && params['amount']) {
          this.result='success';
          const cents = +params['amount'];
          await this.userSrv.updateBalance(cents / 100);
        }
      });
    }

}
