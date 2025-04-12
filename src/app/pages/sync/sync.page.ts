import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DataService } from 'src/app/services/database/data.service';
import { ToastController } from '@ionic/angular';
import { Inventory } from 'src/app/models/inventory'; // Added import for Inventory type

@Component({
  selector: 'app-sync',
  templateUrl: './sync.page.html',
  styleUrls: ['./sync.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SyncPage implements OnInit {
  selectedDate: string = '';
  routeNo: string = '';
  baseURL: string = "http://3.208.13.82:2078/akiproorders/downloadinvoices"

  constructor(private loadingCtrl: LoadingController, private http: HttpClient, private data: DataService, private toastController: ToastController) { }

  ngOnInit() {
  }

  minDate = '2024-09-2'
  // get minDate() {
  //   const min = new Date();
  //   min.setDate(min.getDate() - 14);
  //   return min.toISOString().split('T')[0];
  // }

  maxDate = '2024-09-2'
  // get maxDate() {
  //   const max = new Date();
  //   max.setDate(max.getDate() + 7);
  //   return max.toISOString().split('T')[0];
  // }

  onDateSelected(event: any) {
    this.selectedDate = event.detail.value.split('T')[0];
  }

  async downloadAndSave() {
    const loading = await this.loadingCtrl.create({
      message: "Downloading and Storing Data",
      spinner: 'crescent',
      backdropDismiss: false
    });

    await loading.present();
    try {
      const route = `route${this.routeNo}`
      this.data.fetchData(this.selectedDate, route);
      // Added snippet below, adjusted for context
      const invoiceNo = 913468; // The invoice number you want to filter by
      this.data.fetchData(this.selectedDate, route, invoiceNo).then((inventory: Inventory[]) => {
        console.log(`Inventory for Invoice ${invoiceNo}:`, inventory);
      }).catch((error) => {
        console.error('Error fetching inventory:', error);
      });
    } catch(err) {
      console.log('Ionic Download failed: ', err);
    } finally {
      await loading.dismiss();
    }
  }
}