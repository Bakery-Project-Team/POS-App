import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Injectable } from '@angular/core';
import { SQLiteService } from './sqlite.service';
import { DbnameVersionService } from './dbname-version.service';
import { UserUpgradeStatements } from '../../upgrades/user.upgrade.statements';
import { Customer } from '../../models/customer';
import { InvoiceItem } from '../../models/invoice_item';
import { Invoice } from '../../models/invoice';
import { BehaviorSubject, Observable } from 'rxjs';
import { Toast } from '@capacitor/toast';
import { frequency } from 'src/app/models/frequency';
import { inventory } from 'src/app/models/inventory';

@Injectable()
export class StorageService {
    public homePageList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    public returnsList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

    private databaseName: string = "";
    private uUpdStmts: UserUpgradeStatements = new UserUpgradeStatements();
    private versionUpgrades;
    private loadToVersion;
    private db!: SQLiteDBConnection;
    private isDatabaseReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(private sqliteService: SQLiteService, private dbVerService: DbnameVersionService) {
        this.versionUpgrades = this.uUpdStmts.userUpgrades;
        this.loadToVersion = this.versionUpgrades[this.versionUpgrades.length - 1].toVersion;
    }

    async initializeDatabase(dbName: string) {
        this.databaseName = dbName;
        await this.sqliteService.addUpgradeStatement({ database: this.databaseName, upgrade: this.versionUpgrades });
        this.db = await this.sqliteService.openDatabase(this.databaseName, false, 'no-encryption', this.loadToVersion, false);
        this.dbVerService.set(this.databaseName, this.loadToVersion);
        await this.loadData();
    }

    databaseState() {
        return this.isDatabaseReady.asObservable();
    }

    // Adds a single invoice item
    async addInvoiceItem(item: InvoiceItem) {
        const sql = `INSERT INTO invoiceitems (itemNo, numPerPack, orderNo, packs, partNo, quantity, returnsNo, price, vat, vatRate, discrepancies, discount, creditNotes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        await this.db.run(sql, [
            item.itemNo,
            item.numPerPack,
            item.orderNo,
            item.packs,
            item.partNo,
            item.quantity,
            item.returnsNo,
            item.price,
            item.vat,
            item.vatRate,
            item.discrepancies,
            item.discount,
            item.creditNotes
        ]);
        await this.loadData();
    }

    // Adds a list of invoice items
    async addInvoiceItems(items: InvoiceItem[]) {
        const sql = `INSERT INTO invoiceitems (itemNo, numPerPack, orderNo, packs, partNo, quantity, returnsNo, price, vat, vatRate, discrepancies, discount, creditNotes)
        VALUES `;

        var values = items.map(item => `(${item.itemNo}, ${item.numPerPack}, ${item.orderNo}, ${item.packs}, '${item.partNo.replace(/'/g, "''")}', ${item.quantity}, ${item.returnsNo}, ${item.price}, ${item.vat}, ${item.vatRate}, ${item.discrepancies}, ${item.discount}, ${item.creditNotes})`).join(",\n");
        values += ';';

        await this.db.execute(sql + values);
        await this.loadData();
    }

    // Adds a single invoice
    async addInvoice(invoice: Invoice) {
        const sql = `INSERT INTO invoices (invoiceNo, orderNo, custNo, routeNo, standingDay, invoiceDate, generate, generalNote, custDiscount, taxRate, terms,
                    totalDiscount, totalDiscount_adjdown, totalDiscount_adjup, totalItems, totalItems_adjdown, totalItems_adjup, totalVat, totalVat_adjdown, totalVat_adjup)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        await this.db.run(sql, [
            invoice.invoiceNo,
            invoice.orderNo,
            invoice.custNo,
            invoice.routeNo,
            invoice.standingDay,
            invoice.invoiceDate,
            invoice.generate,
            invoice.generalNote || null,
            invoice.custDiscount,
            invoice.taxRate,
            invoice.terms || null,
            invoice.totalDiscount,
            invoice.totalDiscount_adjdown,
            invoice.totalDiscount_adjup,
            invoice.totalItems,
            invoice.totalItems_adjdown,
            invoice.totalItems_adjup,
            invoice.totalVat,
            invoice.totalVat_adjdown,
            invoice.totalVat_adjup
        ]);
        await this.loadData();
    }

    async addFrequency(freq: { item_number: number; frequency: number }[]) {
        try {
          //console.log('Starting frequency update for:', freq);
      
          for (const frequency of freq) {
            console.log('Processing itemNo:', frequency.item_number);
            const sql = `
              INSERT INTO freq (itemNo, frequency)
              VALUES (${frequency.item_number}, 1)
              ON CONFLICT(itemNo) DO UPDATE 
              SET frequency = frequency + 1;
            `;
            console.log('Executing SQL:', sql);
            await this.db.execute(sql, true);
            console.log('Query executed for itemNo:', frequency.item_number);
          }
      
          console.log('All queries executed.');
          await this.loadData();
          console.log('Frequency update complete.');
          return true; 
        } catch (error) {
          console.error('Error updating frequencies:', error);
          throw error;
        }
      }
      
      
    // Adds a list of invoices
    async addInvoices(invoices: Invoice[]) {
        const sql = `INSERT INTO invoices (invoiceNo, orderNo, custNo, routeNo, standingDay, invoiceDate, generate, generalNote, custDiscount, taxRate, terms,
        totalDiscount, totalDiscount_adjdown, totalDiscount_adjup, totalItems, totalItems_adjdown, totalItems_adjup, totalVat, totalVat_adjdown, totalVat_adjup)
        VALUES `;

        var values = invoices.map(invoice => `(${invoice.invoiceNo}, ${invoice.orderNo}, ${invoice.custNo}, '${invoice.routeNo.replace(/'/g, "''")}', '${invoice.standingDay.replace(/'/g, "''")}', '${invoice.invoiceDate.replace(/'/g, "''")}', '${invoice.generate.replace(/'/g, "''")}', '${invoice.generalNote.replace(/'/g, "''")}', ${invoice.custDiscount}, ${invoice.taxRate}, '${invoice.terms.replace(/'/g, "''")}', ${invoice.totalDiscount}, ${invoice.totalDiscount_adjdown}, ${invoice.totalDiscount_adjup}, ${invoice.totalItems}, ${invoice.totalItems_adjdown}, ${invoice.totalItems_adjup}, ${invoice.totalVat}, ${invoice.totalVat_adjdown}, ${invoice.totalVat_adjup})`).join(",\n");
        values += ';';

        await this.db.execute(sql + values);
        await this.loadData();
    }

    async addSale(sales: { itemNo: number, orderNo: number, quantity: number }[]) {
        if (sales.length === 0) return;
      
        const sql = `INSERT INTO inv (itemNo, orderNo, quantity) VALUES `;
      
        const values = sales.map(sale =>
          `(${sale.itemNo}, ${sale.orderNo}, ${sale.quantity})`
        ).join(",\n");
      
        await this.db.execute(sql + values + ';');
      }
      
      

    // Gets all items on an invoice by order number
    async getInvoiceItems(orderNo: number) {
        const result: InvoiceItem[] = (await this.db.query('SELECT * FROM invoiceitems WHERE orderNo = ?', [orderNo])).values as InvoiceItem[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Get invoice item by orderNo and itemNo
    async getSingleInvoiceItem(itemNo: number, orderNo: number) {
        const result: InvoiceItem[] = (await this.db.query('SELECT * FROM invoiceitems WHERE itemNo = ? AND orderNo = ?', [itemNo, orderNo,])).values as InvoiceItem[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // used to pull all invoice records from database
    async getAllInvoices(){
        const result: Invoice[] = (await this.db.query('SELECT * FROM INVOICES')).values as Invoice[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Gets invoices by invoice number
    async getInvoice(invoiceNo: number) {
        const result: Invoice[] = (await this.db.query('SELECT * FROM invoices WHERE invoiceNo = ?', [invoiceNo])).values as Invoice[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Gets invoice by order number
    async getInvoicebyOrderNo(orderNo: number) {
        const result: Invoice[] = (await this.db.query('SELECT * FROM invoices where orderNo = ?', [orderNo])).values as Invoice[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Gets invoice by customer ID
    async getInvoicesbyCustNo(custNo: number) {
        const result: Invoice[] = (await this.db.query('SELECT * FROM invoices WHERE custNo = ?', [custNo])).values as Invoice[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Log Return by ItemNo and OrderNo
    async logReturn(itemNo: number, orderNo: number, returnsNo: number, generalNote: string | null) {
        var invoice = this.getInvoicebyOrderNo(orderNo);
        var item = this.getSingleInvoiceItem(itemNo, orderNo);
        if (item != null && invoice != null) {
            await this.db.run('UPDATE invoiceitems SET returnsNo = ? WHERE orderNo = ?', [returnsNo, orderNo]);
            if (generalNote != null) {
                await this.db.run('UPDATE invoices SET generalNote = ? WHERE orderNo = ?', [generalNote, orderNo]);
            }
            await this.loadData();
        } else {
            await Toast.show({
                text: 'Error logging return!',
                duration: 'short',
                position: 'bottom'
            });
        }
    }

    async logReturns( items: { itemNo: number, orderNo: number, returnsNo: number, generalNote: string | null}[]) {
        try {
            //await this.db.execute('BEGIN TRANSACTION;');

            for (const item of items) {
                const { itemNo, orderNo, returnsNo, generalNote } = item;
                await this.db.run(
                    'UPDATE invoiceitems SET returnsNo = ? WHERE itemNo = ? AND orderNo = ?',
                    [returnsNo, itemNo, orderNo]);

                if (generalNote != null) {
                    await this.db.run(
                        'UPDATE invoices SET generalNote = ? WHERE orderNo = ?',
                        [generalNote, orderNo]
                    );
                }
            }

            //await this.db.execute('COMMIT');
            await this.loadData();
        } catch (error) {
            await this.db.execute('ROLLBACK');
            await Toast.show({
                text: 'Error logging returns!',
                duration: 'short',
                position: 'bottom',
            });
        }
    }

    // Log Discrepency by ItemNo and OrderNo
    async logDiscrepency(itemNo: number, orderNo: number, discrepencies: number, generalNote: string | null) {
        var invoice = this.getInvoicebyOrderNo(orderNo);
        var item = this.getSingleInvoiceItem(itemNo, orderNo);
        if (item != null && invoice != null) {
            await this.db.run('UPDATE invoiceitems SET discrepancies = ? WHERE orderNo = ?', [discrepencies, orderNo]);
            if (generalNote != null) {
                await this.db.run('UPDATE invoices SET generalNote = ? WHERE orderNo = ?', [generalNote, orderNo]);
            }
            await this.loadData();
        } else {
            await Toast.show({
                text: 'Error logging discrepancy!',
                duration: 'short',
                position: 'bottom'
            });
        }
    }

    // Log Credit Notes
    async logCreditNote(itemNo: number, orderNo: number, creditNotes: number, generalNote: string | null) {
        var invoice = this.getInvoicebyOrderNo(orderNo);
        var item = this.getSingleInvoiceItem(itemNo, orderNo);
        if (item != null && invoice != null) {
            await this.db.run('UPDATE invoiceitems SET creditNotes = ? WHERE orderNo = ?', [creditNotes, orderNo]);
            if (generalNote != null) {
                await this.db.run('UPDATE invoices SET generalNote = ? WHERE orderNo = ?', [generalNote, orderNo]);
            }
            await this.loadData();
        } else {
            await Toast.show({
                text: 'Error logging credit note!',
                duration: 'short',
                position: 'bottom'
            });
        }
    }

    // Mark Invoice Delivered
    async updateInvoiceStatus(invoiceNo: number, status: string) {
        var invoice = this.getInvoice(invoiceNo);
        if (invoice != null) {
            await this.db.run('UPDATE invoices SET generate = ? WHERE invoiceNo = ?', [status, invoiceNo])
            await this.loadData();
        } else {
            await Toast.show({
                text: 'Error updating delivery status!',
                duration: 'short',
                position: 'bottom'
            });
        }
    }

    // Loads Invoices Data into homePageList
    async loadHomePageData() {
        //const result = await this.db.query(`SELECT i.*, c.company FROM invoices i JOIN customers c ON i.custNo = c.id;`);
        //this.homePageList.next(result.values || []);
    }

    // Loads Returns Data into returnsList
    async loadReturnsData() {
        // const result = (await this.db.query('SELECT inv.*, inv_item.* FROM invoices inv JOIN invoiceitems inv_item ON inv.orderNo = inv_item.orderNo WHERE inv_item.returnsNo > 0'))
        // const results = result.values
        // if (results != null) {
        //     const grouped: any = {};

        //     results.forEach(row => {
        //         const orderNo = row.orderNo;
        //         if (!grouped[orderNo]) {
        //             grouped[orderNo] = {
        //                 ...row,
        //                 items: []
        //             };
        //         }
        //         grouped[orderNo].items.push({
        //             'itemNo': row.itemNo,
        //             'returnsNo': row.returnsNo,
        //             'discrepancies': row.discrepancies,
        //         });
        //     });

        //     const groupedArr = Object.values(grouped);
        //     //this.returnsList.next(groupedArr);
        // } else {
        //    // this.returnsList.next([]);
        // }
    }

    // Refreshes All Data
    async loadData() {
        await Promise.all([this.loadHomePageData(), this.loadReturnsData()]);
        this.isDatabaseReady.next(true);
    }

    async getFrequencies() {
        const result: frequency[] = (await this.db.query('SELECT * FROM freq')).values as frequency[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    async getSales() {
        const result: inventory[] = (await this.db.query('SELECT * FROM inv')).values as inventory[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }
    

}