import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css'],
  imports: [FormsModule],
})
export class PaymentModalComponent {
  @Input() amount: number = 0;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }


}
