import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';  // ✅ Import FormsModule
import { CommonModule } from '@angular/common';
import { AddItemModalComponent } from '../add-item-modal/add-item-modal.component';
import { StorageService } from 'src/app/services/database/storage.service';
import { Toast } from '@capacitor/toast';

@Component({
  selector: 'app-return-discrepancy-modal',
  templateUrl: './return-discrepancy-modal.component.html',
  styleUrls: ['./return-discrepancy-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ReturnDiscrepancyModalComponent implements OnInit {
  @Input() invoice!: any;
  items!: any;
  selectedItems: any[] = [];
  selectedType: string = "return";

  constructor(private modalCtrl: ModalController, private storage: StorageService) {}

  async ngOnInit() {
    this.items = await this.storage.getInvoiceItems(this.invoice.orderNo);
  }

  async addItem() {
    const modal = await this.modalCtrl.create({
      component: AddItemModalComponent,
      componentProps: { productList: this.items }
    });
  
    modal.onDidDismiss().then((selectedItems: any) => {
      if (selectedItems) {
        this.selectedItems.push(selectedItems.data);
      }
    });

    return await modal.present();
  }

  async postChange() {
    const returns = this.selectedItems.map((item) => ({
      itemNo: item.product.itemNo, 
      orderNo: item.product.orderNo, 
      returnsNo: item.quantity, 
      generalNote: '' 
    }));

    await this.storage.logReturns(returns);
    this.modalCtrl.dismiss();
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
