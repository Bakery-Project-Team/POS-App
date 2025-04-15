import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Invoice } from 'src/app/models/invoice';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReturnDiscrepancyModalComponent } from '../return-discrepancy-modal/return-discrepancy-modal.component';
import { StorageService } from 'src/app/services/database/storage.service';
import { Toast } from '@capacitor/toast';
import { NyxPrinter } from 'nyx-printer/src';

@Component({
  selector: 'app-invoicedetails',
  templateUrl: './invoicedetails.component.html',
  styleUrls: ['./invoicedetails.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class InvoicedetailsComponent {
  @Input() invoice!: any;
  @Input() items!: any;

  constructor(private modalCtrl: ModalController, private storage: StorageService) { }

  close() {
    this.modalCtrl.dismiss();
  }

  async confirmDelivery() {
    await this.storage.updateInvoiceStatus(this.invoice.invoiceNo, 'Y');
    console.log("Delivery confirmed for Invoice:", this.invoice.invoiceNo);
    NyxPrinter.isReady().then(res => {
      if (res.connected) {
        NyxPrinter.printText({ text: 'Hello from Ionic' });
      } else {
        console.error('Printer service not ready yet');
      }
    });
    this.modalCtrl.dismiss();
  }

  async handleReturnOrDiscrepancy() {
    const modal = await this.modalCtrl.create({
      component: ReturnDiscrepancyModalComponent,
      componentProps: { invoice: this.invoice }
    });
    return await modal.present();
  }
}