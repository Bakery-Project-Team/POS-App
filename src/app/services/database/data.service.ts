import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Customer } from '../../models/customer';
import { item } from '../../models/item';
import { InvoiceItem } from '../../models/invoice_item';
import { Invoice } from '../../models/invoice';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class DataService {
  private baseURL = "http://3.208.13.82:2078/akiproorders/downloadinvoices";
  private customerList: Customer[] = [];
  private invoiceItemList: InvoiceItem[] = [];
  private invoiceList: Invoice[] = [];
  private items: item[] = [];

  constructor(private storage: StorageService, private http: HttpClient) {}

 /* async fetchData(date: string, route: string) {
    const url = `${this.baseURL}/${date}/${route}`

    this.http.get(url).subscribe({
      next: async (data) => {
        console.log("Ionic Response Receieved")
        const customers_items = (data as any).customer_details;

        if (customers_items) {
          customers_items.forEach(async (record: any) => {
            if (this.checkRecord(record) == 'customer') {
              this.pushCustomer(record);
            } else {
              this.pushInvoiceItem(record);
            }
          });
        }

        const invoices = (data as any).invoice_master;
        if (invoices) {
          invoices.forEach((record: any) => {
            this.pushInvoice(record);
          })
        }

        this.mapCust();
        await this.store();
      },
      error: (error) => console.log("Ionic Error requesting: ", error.message)
    });
  }
*/
async fetchData(date: string, route: string) {
  const url = `${this.baseURL}/${date}/${route}`;

  this.http.get(url).subscribe({
    next: async (data) => {
      console.log("Ionic Response Received");

      // ✅ Get only the first customer/invoice item
      const customers_items = (data as any).customer_details;
      const firstRecord = customers_items?.[0];

      if (firstRecord) {
        if (this.checkRecord(firstRecord) === 'customer') {
          this.pushCustomer(firstRecord);
        } else {
          this.pushInvoiceItem(firstRecord);
        }
      }

      // ✅ Get only the first invoice
      const invoices = (data as any).invoice_master;
      const firstInvoice = invoices?.[0];
      if (firstInvoice) {
        this.pushInvoice(firstInvoice);
      }

      this.mapCust(); // still needed if you're linking customer IDs
      await this.store(); // stores just 1 record per list now
    },
    error: (error) => console.log("Ionic Error requesting: ", error.message)
  });
}


  checkRecord(record: any) {
    if ('company' in record.attributes) {
      return 'customer';
    }
    return 'invoiceItem';
  }

  pushCustomer(record: any) {
    this.customerList.push({
      'id': record.attributes.custno,
      'areaNo': record.attributes.areano,
      'lastInvoiceDate': record.attributes.lastinvoicedate,
      'company': record.attributes.company,
      'contact': record.attributes.contact ?? "",
      'email': record.attributes.emailaddress ?? "",
      'phone': record.attributes.phone,
      'terms': record.attributes.terms ?? "",
      'type': record.attributes.type,
      'addr1': record.attributes.addr1,
      'addr2': record.attributes.addr2 ?? ""
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

  pushItem(item: any) {
    this.items.push({
      'itemNo': item.attributes.itemno,
      'numPerPack': item.attributes.num_per_pack,
      'frequency': item.attributes.frequency,
      'packs': item.attributes.packs,
      'qty': item.attributes.qty,
      'price': item.attributes.storedprice,
      'storedPrice': item.attributes.storedprice
      
    });
  }

  mapCust() {
    var count = 0;
    const customerIDs = this.invoiceList.map(c => c.custNo).filter(Boolean);

    this.customerList.forEach(customer => {
      customer.id = customerIDs[count];
      count++;
    })
  }

  async store() {
    await this.storage.addCustomers(this.customerList);
    await this.storage.addInvoices(this.invoiceList);
    await this.storage.addInvoiceItems(this.invoiceItemList);
  }
}