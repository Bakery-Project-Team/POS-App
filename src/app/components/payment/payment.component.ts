import { Component, OnInit, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class PaymentComponent implements OnInit {
  @Input() total: number = 0;
  paymentMethod: string = 'cash';
  cashAmount: number = 0;
  change: number = 0;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {}

  calcChange() {
    this.change = this.cashAmount - this.total;
  }

  async confirmPayment() {
    await this.modalCtrl.dismiss({
      paid: true,
      method: this.paymentMethod,
      cashAmount: this.cashAmount,
      change: this.change
    });
  }

  async cancel() {
    await this.modalCtrl.dismiss({
      paid: false
    });
  }

}
