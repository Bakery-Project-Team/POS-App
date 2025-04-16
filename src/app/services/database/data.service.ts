import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Customer } from '../../models/customer';
import { InvoiceItem } from '../../models/invoice_item';
import { Invoice } from '../../models/invoice';
import { HttpClient } from '@angular/common/http';
import { NyxPrinter } from 'nyx-printer/src';


@Injectable({
  providedIn: 'root'
})

export class DataService {
  private baseURL = "http://3.208.13.82:2078/akiproorders/invoiceinventory";
  private customerList: Customer[] = [];
  private invoiceItemList: InvoiceItem[] = [];
  private invoiceList: Invoice[] = [];
  private orderNo: number = 0;

  constructor(private storage: StorageService, private http: HttpClient) {}

  async fetchData(invoiceNo: string) {
    this.invoiceList = [];
    this.invoiceItemList = [];

    const url = `${this.baseURL}/${invoiceNo}`

    this.http.get(url).subscribe({
      next: async (data) => {
        console.log("Ionic Response Receieved: ")

        const invoices = (data as any).invoice_master;
        invoices.forEach(async (record: any) => {
          await this.pushInvoice(record);
        })

        const invoice_items = (data as any).invoice_items;
        invoice_items.forEach(async (record: any) => {
          await this.pushInvoiceItem(record);
        });
    
        await this.storage.addInvoices(this.invoiceList);
        await this.storage.addInvoiceItems(this.invoiceItemList);
        this.orderNo = this.invoiceList[0].orderNo;
        await this.storage.saveMetadata('order_number', this.orderNo.toString());
        await this.storage.loadData();

        var receipt = `Confirmation of Download\nInvoice: ${this.invoiceList[0].invoiceNo}\nList of Items:\n`;
        this.invoiceItemList.forEach(item => receipt += `${item.itemNo} x ${item.quantity} units\n`);
        receipt += "\n\n\n________________________\n     Signature\n\n\n";

        NyxPrinter.isReady().then(res => {
          if (res.connected) {
            NyxPrinter.printText({ text: receipt });
          } else {
            console.error('Printer service not ready yet');
          }
        });
      },
      error: (error) => console.log("Ionic Error requesting: ", error.message)
    });
  }

  pushInvoiceItem(invoiceItem: any) {
    this.invoiceItemList.push({
      'itemNo': invoiceItem.attributes.itemno,
      'numPerPack': invoiceItem.attributes.num_per_pack,
      'orderNo': invoiceItem.attributes.orderno,
      'packs': invoiceItem.attributes.packs,
      'partNo': invoiceItem.attributes.partno,
      'quantity': invoiceItem.attributes.qty,
      'returnsNo': invoiceItem.attributes.returnsno,
      'price': invoiceItem.attributes.storedprice,
      'vat': invoiceItem.attributes.vatamount,
      'vatRate': invoiceItem.attributes.vatrate,
      'discrepancies': invoiceItem.attributes.discrepencies,
      'discount': invoiceItem.attributes.discount,
      'creditNotes': invoiceItem.attributes.creditnotes
    });
  }

  pushInvoice(invoice: any) {
    this.invoiceList.push({
      'invoiceNo': invoice.attributes.invoiceno,
      'orderNo': invoice.attributes.orderno,
      'custNo': invoice.attributes.custno,
      'routeNo': invoice.attributes.routeno,
      'standingDay': invoice.attributes.standing_day,
      'invoiceDate': invoice.attributes.invoicedate,
      'generate': invoice.attributes.generate,
      'generalNote': invoice.attributes.generalnote ?? "",
      'custDiscount': invoice.attributes.custdiscount,
      'taxRate': invoice.attributes.taxrate,
      'terms': invoice.attributes.terms ?? "",
      'totalDiscount': invoice.attributes.totaldiscount,
      'totalDiscount_adjdown': invoice.attributes.totaldiscount_adjdown,
      'totalDiscount_adjup': invoice.attributes.totaldiscount_adjup,
      'totalItems': invoice.attributes.totalitems,
      'totalItems_adjdown': invoice.attributes.totalitems_adjdown,
      'totalItems_adjup': invoice.attributes.totalitems_adjup,
      'totalVat': invoice.attributes.totalvat,
      'totalVat_adjdown': invoice.attributes.totalvat_adjdown,
      'totalVat_adjup': invoice.attributes.totalvat_adjup
    });
  }

}