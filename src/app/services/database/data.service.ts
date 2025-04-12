import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Customer } from '../../models/customer';
import { Inventory } from '../../models/inventory';
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
  private inventoryList: Inventory[] = [];
  //inventory: Inventory;

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
async fetchData(date: string, route: string, targetInvoiceNo?: number): Promise<Inventory[]> {
  const url = targetInvoiceNo
    ? `http://3.208.13.82:2078/akiproorders/invoiceinventory/${targetInvoiceNo}`
    : `http://3.208.13.82:2078/akiproorders/downloadinvoices/${date}/${route}`;
  console.log(`Fetching data from URL: ${url}`);

  return new Promise((resolve, reject) => {
    this.http.get(url).subscribe({
      next: async (data) => {
        console.log("Ionic Response Received");
        console.log("Raw API Response:", JSON.stringify(data, null, 2));

        // Initialize inventory list for export
        const inventoryExport: Inventory[] = [];

        // Process customer_details
        const customers_items = (data as any).customer_details;
        console.log("Customer Details (Raw):", customers_items);

        if (customers_items?.length) {
          customers_items.forEach((record: any) => {
            const recordType = this.checkRecord(record);
            console.log("Record Type:", recordType);

            if (recordType === 'customer') {
              this.pushCustomer(record);
              console.log("Customer List after push:", this.customerList);
            } else {
              this.pushInvoiceItem(record);
              console.log("Invoice Item List after push:", this.invoiceItemList);
            }
          });
        } else {
          console.log("No customer_items records found.");
        }

        // Process invoice_master
        const invoices = (data as any).invoice_master;
        if (invoices?.length) {
          invoices.forEach((record: any) => {
            this.pushInvoice(record);
          });
          console.log("Invoice List after push:", this.invoiceList);
        } else {
          console.log("No invoices found.");
        }

        // Process invoice_items for inventory export
        const invoiceItems = (data as any).invoice_items;
        if (invoiceItems?.length) {
          let targetOrderNo: number | undefined;
          if (targetInvoiceNo) {
            const matchingInvoice = invoices?.find(
              (inv: any) => inv.attributes.invoiceno === targetInvoiceNo
            );
            targetOrderNo = matchingInvoice?.attributes.orderno;
            console.log(`Target Invoice ${targetInvoiceNo} maps to OrderNo: ${targetOrderNo}`);
          }

          invoiceItems.forEach((item: any) => {
            const attributes = item.attributes;
            console.log(`Checking item ${attributes.itemno} with orderno ${attributes.orderno}`);
            if (!targetInvoiceNo || attributes.orderno === targetOrderNo) {
              console.log(`Including item ${attributes.itemno}`);
              const inventoryItem: Inventory = {
                itemNo: attributes.itemno,
                qty: attributes.qty,
                price: attributes.storedprice,
                frequency: 1,
                storedPrice: attributes.storedprice,
                packs: attributes.packs,
                numPerPack: attributes.num_per_pack
              };
              inventoryExport.push(inventoryItem);
            } else {
              console.log(`Excluding item ${attributes.itemno} (orderno ${attributes.orderno} != ${targetOrderNo})`);
            }
          });
          console.log("Inventory Export:", inventoryExport);
        } else {
          console.log("No invoice items found for inventory export.");
        }

        // Map customers and store data
        this.mapCust();
        await this.store();

        resolve(inventoryExport);
      },
      error: (error) => {
        console.log("Ionic Error requesting:", error.message);
        reject(error);
      }
    });
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

  pushItem(inventory: any) {
    this.inventoryList.push({
      'itemNo': inventory.attributes.itemno,
      'numPerPack': inventory.attributes.num_per_pack,
      'frequency': inventory.attributes.frequency,
      'packs': inventory.attributes.packs,
      'qty': inventory.attributes.qty,
      'price': inventory.attributes.storedprice,
      'storedPrice': inventory.attributes.storedprice
      
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
    for (const item of this.inventoryList) {
      await this.storage.addItem(item);
    }
  }
}