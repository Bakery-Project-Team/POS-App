export class UserUpgradeStatements {
    userUpgrades = [
        {
        toVersion: 1,
        statements: [
            `PRAGMA foreign_keys = ON;`,
            `CREATE TABLE IF NOT EXISTS invoices(
            invoiceNo INTEGER PRIMARY KEY,
            orderNo INTEGER UNIQUE NOT NULL,
            custNo INTEGER NOT NULL,
            routeNo TEXT NOT NULL,
            standingDay TEXT NOT NULL,
            invoiceDate TEXT NOT NULL,
            generate TEXT NOT NULL,
            generalNote TEXT,
            custDiscount,
            taxRate REAL,
            terms TEXT,
            totalDiscount REAL,
            totalDiscount_adjdown REAL,
            totalDiscount_adjup REAL,
            totalItems REAL,
            totalItems_adjdown REAL,
            totalItems_adjup REAL,
            totalVat REAL,
            totalVat_adjdown REAL,
            totalVat_adjup REAL
            );`,
            `CREATE TABLE IF NOT EXISTS invoiceitems(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemNo INTEGER UNIQUE NOT NULL,
            numPerPack REAL,
            orderNo INTEGER NOT NULL,
            packs REAL,
            partNo TEXT NOT NULL,
            quantity REAL NOT NULL,
            returnsNo REAL,
            price REAL NOT NULL,
            vat REAL,
            vatRate REAL,
            discrepancies REAL,
            discount REAL,
            creditNotes INTEGER,
            FOREIGN KEY (orderNo) REFERENCES invoices(orderNo) ON DELETE CASCADE
            );`,
            `CREATE TABLE freq (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemNo INTEGER UNIQUE,
            frequency INTEGER,
            FOREIGN KEY (itemNo) REFERENCES invoiceitems(itemNo) ON DELETE CASCADE
            );`,
            `CREATE TABLE inv (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemNo INTEGER,
            orderNo INTEGER,
            quantity INTEGER,
            FOREIGN KEY (itemNo) REFERENCES invoiceitems(itemNo) ON DELETE CASCADE,
            FOREIGN KEY (orderNo) REFERENCES invoices(orderNo) ON DELETE CASCADE
            );`
            
        ]
        },
        //{
            /*
        toVersion: 2,
        statements: [
            
        ]
            */
       // },
    ]
}    