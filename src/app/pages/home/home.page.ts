import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/database/storage.service';
import { Invoice } from '../../models/invoice';
import { InvoicedetailsComponent } from '../../components/invoicedetails/invoicedetails.component';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular'
import { InvoiceItem } from '../../models/invoice_item';
import { IonSearchbar } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { SearchService } from 'src/app/services/search/search.service';
import { PopoverController } from "@ionic/angular";
import { FilterPopoverComponent } from 'src/app/components/filter-popover/filter-popover.component';
import { DataService } from '../../services/database/data.service';

 @Component({
 selector: 'app-home',
 templateUrl: 'home.page.html',
 styleUrls: ['home.page.scss'],
 standalone: true,
 imports: [IonicModule, CommonModule, FormsModule],
 })

 export class HomePage implements OnInit {
   invoiceItems: InvoiceItem[] = [];
   cartItems: InvoiceItem[] = [];
   subTotal: number = 0;
   currOrderNo: number = 0;
   invoiceItemFrequencies: Map<number, number> = new Map();
   sortedInvoiceItems: InvoiceItem[] = [];

   

  constructor(private storage: StorageService, private modalCtrl: ModalController, private searchService: SearchService, private popOverCtrl: PopoverController, private dataService: DataService) {}

  
  async ngOnInit() {
    await this.loadAllInvoiceItems();

  }

 /* async loadInvoiceItems(invoiceNo: string) {               // this method was used to load a single invoice before(it works for testing just uncomment and use any invoice number)
    
    await this.dataService.fetchData(invoiceNo); // fetch data from db
    
   
    const invoice = await this.storage.getInvoice(Number(invoiceNo)); 
    if (invoice && invoice[0]) {
      this.currOrderNo = invoice[0].orderNo;
      
      const items = await this.storage.getInvoiceItems(this.currOrderNo);
      if (items) {

        items.forEach(item => {
          const frequency = this.invoiceItemFrequencies.get(item.itemNo) || 0;
          this.invoiceItemFrequencies.set(item.itemNo, frequency + item.quantity);
        });
        this.invoiceItems = items;
        await this.sortInvoiceItems(); // sort items based on frequency
        console.log(this.invoiceItems); 
      }
    }
  }
    */
  async loadAllInvoiceItems() {
    try{
      const invoices = await this.storage.getAllInvoices();
      if (invoices != null) {

        for(const invoice of invoices){

          const items = await this.storage.getInvoiceItems(invoice.orderNo);
  
          if (items) {
            items.forEach(item => {   // update frequency map
              const currentFreq = this.invoiceItemFrequencies.get(item.itemNo) || 0;
              this.invoiceItemFrequencies.set(item.itemNo, currentFreq + item.quantity);
            });
  
             // Add unique items to our items list
          items.forEach(item => {
            if (!this.invoiceItems.some(existing => existing.itemNo === item.itemNo)) {
              this.invoiceItems.push(item);
            }
          });
        }
      }
    }

    await this.sortInvoiceItems();
    console.log('Sorted items by frequency:', this.invoiceItems);
  } catch (error) {
    console.error('Error loading invoice data:', error);
  }

}    
  

    // sorts the invoice items based on frequency
  async sortInvoiceItems() {

    this.sortedInvoiceItems = this.invoiceItems.slice().sort((a, b) => {

      const freqA = this.invoiceItemFrequencies.get(a.itemNo) || 0;
      const freqB = this.invoiceItemFrequencies.get(b.itemNo) || 0;

     return freqB - freqA; // (highest frequency first)
  });

  this.invoiceItems = this.sortedInvoiceItems; // updating the items
  }

  

   addToCart(item: InvoiceItem) { 
    const existingItem = this.cartItems.find(i => i.itemNo === item.itemNo);
    
    if (existingItem) {
      existingItem.quantity++;
    } else {
      // Create a new cart item from the invoice item
      const cartItem: InvoiceItem = {
        ...item,
        quantity: 1
      };
      this.cartItems.push(cartItem);
    }
    this.calculateSubtotal();
  }

   decreaseQuantity(index: number) { 
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
      this.calculateSubtotal();
    } else {
      this.cartItems.splice(index, 1);
      this.calculateSubtotal();
    }
  }

   increaseQuantity(index: number) { 
    this.cartItems[index].quantity++;
    this.calculateSubtotal();
  }

  calculateSubtotal() {
    this.subTotal = this.cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);

    }, 0);
  }

  async confirmSale() {
    if (this.cartItems.length > 0) {
      try {
        console.log('Sale confirmed:', {
          items: this.cartItems,
          total: this.subTotal
        });
  
        // Prepare frequency update list
        const freqUpdates = this.cartItems.map(cartItem => ({
          item_number: cartItem.itemNo,
          frequency: 1
        }));
  
        await this.storage.addFrequency(freqUpdates);
        console.log('Frequencies updated successfully.');
  
        // Prepare sale records for inv table
        const saleRecords = this.cartItems.map(cartItem => ({
          itemNo: cartItem.itemNo,
          orderNo: cartItem.orderNo,  
          quantity: cartItem.quantity
        }));
  
        await this.storage.addSale(saleRecords);
        console.log('Sales recorded in inv successfully.');
  
        this.cartItems = [];
        this.subTotal = 0;
  
        const frequencies = await this.storage.getFrequencies();
        console.log('Current frequencies:', frequencies);

        const sales = await this.storage.getSales();
        console.log('Current inv table:', sales)
  
      } catch (error) {
        console.error('Error confirming sale:', error);
      }
    }
  }
  
  

   removeFromCart(index: number) { 
    this.cartItems.splice(index, 1);
    this.calculateSubtotal();
  }
}

  