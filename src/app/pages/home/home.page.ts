import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/database/storage.service';
import { Invoice } from '../../models/invoice';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular'
import { InvoiceItem } from '../../models/invoice_item';
import { IonSearchbar } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { SearchService } from 'src/app/services/search/search.service';
import { PopoverController } from "@ionic/angular";
import { DataService } from '../../services/database/data.service';
import { inventory } from 'src/app/models/inventory';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})

 export class HomePage implements OnInit {
  invoices!: Invoice[];
  invoiceItems!: InvoiceItem[];
  salesList!: inventory[];

   cartItems: InvoiceItem[] = [];
   subTotal: number = 0;
   currOrderNo: number = 0;
   invoiceItemFrequencies: Map<number, number> = new Map();
   sortedInvoiceItems: InvoiceItem[] = [];

  subTotal: number = 0;
  currOrderNo: number = 0;
  invoiceItemFrequencies: Map<number, number> = new Map();
  sortedInvoiceItems: InvoiceItem[] = [];
  itemQuantityArr: number[] = [];
  currentQuantityArr: number[] = [];



  constructor(private storage: StorageService, private modalCtrl: ModalController, private searchService: SearchService, private popOverCtrl: PopoverController, private dataService: DataService) { }


  async ngOnInit() {
    console.log(this.storage.loadAllInvoiceItemsByFrequency());

    this.storage.invoiceList.subscribe(async data => {
      this.invoices = data;
    });

    this.storage.invoiceItemList.subscribe(async data => {
      this.invoiceItems = data;

      this.itemQuantityArr = this.invoiceItems.map(item => item.quantity);
      this.currentQuantityArr = new Array(this.invoiceItems.length).fill(0);

      this.storage.salesList.subscribe(async data => {
        this.salesList = data;

        this.invoiceItems.forEach((invoiceItem, index) => {
          const totalSalesQuantity = this.salesList
            .filter(sale => sale.itemNo === invoiceItem.itemNo && sale.orderNo === invoiceItem.orderNo)
            .reduce((sum, sale) => sum + sale.quantity, 0);

          this.itemQuantityArr[index] -= totalSalesQuantity;
          if (this.itemQuantityArr[index] < 0) {
            this.itemQuantityArr[index] = 0;
          }
        })
      });
    });
  }

  // async loadAllInvoiceItems() {
  //   try{
  //       for(const invoice of invoices){

  //         const items = await this.storage.getInvoiceItems(invoice.orderNo);

  //         if (items) {
  //           items.forEach(item => {   // update frequency map
  //             const currentFreq = this.invoiceItemFrequencies.get(item.itemNo) || 0;
  //             this.invoiceItemFrequencies.set(item.itemNo, currentFreq + item.quantity);
  //           });

  //            // Add unique items to our items list
  //         items.forEach(item => {
  //           if (!this.invoiceItems.some(existing => existing.itemNo === item.itemNo)) {
  //             this.invoiceItems.push(item);
  //           }
  //         });
  //       }
  //     }
  //   }



  //   await this.sortInvoiceItems();
  //   console.log('Sorted items by frequency:', this.invoiceItems);
  // } catch (error) {
  //   console.error('Error loading invoice data:', error);
  // }




  // sorts the invoice items based on frequency
  async sortInvoiceItems() {

    this.sortedInvoiceItems = this.invoiceItems.slice().sort((a, b) => {

      const freqA = this.invoiceItemFrequencies.get(a.itemNo) || 0;
      const freqB = this.invoiceItemFrequencies.get(b.itemNo) || 0;

      return freqB - freqA; // (highest frequency first)
    });

    this.invoiceItems = this.sortedInvoiceItems; // updating the items
  }



  addToCart(index: number) {
    if (this.currentQuantityArr[index] < this.itemQuantityArr[index]) {
      this.currentQuantityArr[index]++;
    }

    this.calculateSubtotal();
  }

  removeFromCart(index: number) {
    if (this.currentQuantityArr[index] > 0) {
      this.currentQuantityArr[index]--;
    }

    this.calculateSubtotal();
  }

  validateInput(index: number) {
    const max = this.itemQuantityArr[index];
    let value = this.currentQuantityArr[index];

    if (value < 0) {
      this.currentQuantityArr[index] = 0;
    } else if (value > max) {
      this.currentQuantityArr[index] = max;
    }
  }

  get cartItems() {
    return this.invoiceItems
      .map((item, i) => ({
        ...item,
        selectedQuantity: this.currentQuantityArr[i]
      }))
      .filter(item => item.selectedQuantity > 0)
  }

  calculateSubtotal() {
    this.subTotal = this.cartItems.reduce((total, item) => {
      return total + (item.price * item.selectedQuantity);

    }, 0);
  }

  async confirmSale() {
    console.log('Before: ', await this.storage.getSales())

    console.log('Cart Items to Save: ', this.cartItems);

    const saleRecords = this.cartItems.map(cartItem => ({
      itemNo: cartItem.itemNo,
      orderNo: cartItem.orderNo,
      quantity: cartItem.selectedQuantity
    }));

    await this.storage.addSale(saleRecords);
    console.log('After: ', await this.storage.getSales())

    const freqUpdates = this.cartItems.map(cartItem => ({
      item_number: cartItem.itemNo,
      frequency: 1,
      quantity: cartItem.selectedQuantity
    }));

    await this.storage.addFrequencies(freqUpdates);
    console.log('Frequencies updated successfully.');

    // if (this.cartItems.length > 0) {

    //     // Prepare frequency update list
    //     const freqUpdates = this.cartItems.map(cartItem => ({
    //       item_number: cartItem.itemNo,
    //       frequency: 1
    //     }));

    //     await this.storage.addFrequency(freqUpdates);
    //     console.log('Frequencies updated successfully.');

    //     // Prepare sale records for inv table
    //     const saleRecords = this.cartItems.map(cartItem => ({
    //       itemNo: cartItem.itemNo,
    //       orderNo: cartItem.orderNo,  
    //       quantity: cartItem.quantity
    //     }));

    //     await this.storage.addSale(saleRecords);
    //     console.log('Sales recorded in inv successfully.');

    //     this.cartItems = [];
    //     this.subTotal = 0;

    //     const frequencies = await this.storage.getFrequencies();
    //     console.log('Current frequencies:', frequencies);

    //     const sales = await this.storage.getSales();
    //     console.log('Current inv table:', sales)

    //   } catch (error) {
    //     console.error('Error confirming sale:', error);
    //   }
    // }
  }

}

