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
    public invoiceList: BehaviorSubject<Invoice[]> = new BehaviorSubject<Invoice[]>([]);
    public invoiceItemList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    public salesList: BehaviorSubject<inventory[]> = new BehaviorSubject<inventory[]>([]);

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

    async addFrequencies(frequencies: frequency[]) {
        const sql = `INSERT INTO freq (itemNo, frequency, quantity) VALUES `;
        var values = frequencies.map(item => `(${item.item_number}, ${item.frequency}, ${item.quantity})`).join(",\n");
        values += ';'
        
        await this.db.execute(sql + values);
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

    // Loads Invoices Data into homePageList
    async loadAllInvoices() {
        const result = await this.db.query(`SELECT * FROM invoices`)
        this.invoiceList.next(result.values || []);
    }

    async loadAllInvoiceItems() {
        const result = await this.db.query(`SELECT * FROM invoiceitems`)
        this.invoiceItemList.next(result.values || [])
    }

    async loadAllSales() {
        const result = await this.db.query(`SELECT * FROM inv`)
        this.salesList.next(result.values || [])
    }

    // Refreshes All Data
    async loadData() {
        await Promise.all([this.loadAllInvoices(), this.loadAllInvoiceItems(), this.loadAllSales()]);
        this.isDatabaseReady.next(true);
    }

    async loadAllInvoiceItemsByFrequency() {
        const orderNumberResult = (await this.db.query(`SELECT value FROM app_metadata WHERE key = 'order_number' LIMIT 1`));

        if (!orderNumberResult || !orderNumberResult.values || orderNumberResult.values.length === 0) {
            console.log('No invoice number found in app_metadata');
            return;
        }

        const orderNumberString = orderNumberResult.values[0].value;
        const orderNo = parseInt(orderNumberString, 10);

        console.log(orderNo);

        const result: any[] = (await this.db.query(`SELECT i.*, COALESCE(SUM(s.frequency), 0) AS frequency, COALESCE(SUM(s.quantity), 0) AS salesQuantity FROM invoiceitems i LEFT JOIN freq s ON i.itemNo = s.itemNo WHERE i.orderNo = ? GROUP BY i.itemNo ORDER BY frequency DESC, salesQuantity DESC`, [orderNo])).values as any[];
        const invoiceItemList = [];
        for (let i = 0; i < result.length; i++) {
            invoiceItemList.push({
                item_number: result[i].itemNo,
                frequency: result[i].frequency,
                ...result[i]
            })
        }

        console.log(invoiceItemList);
        this.invoiceItemList.next(invoiceItemList || []);
    }

    async saveMetadata(key: String, value: String) {
        const sql = `INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?);`;
        await this.db.run(sql, [key, value]);
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