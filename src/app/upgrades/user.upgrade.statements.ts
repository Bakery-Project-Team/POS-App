export class UserUpgradeStatements {
    userUpgrades = [
        {
            toVersion: 4,
            statements: [
                `PRAGMA foreign_keys = ON;`,
                `CREATE TABLE IF NOT EXISTS customers(
            id INTEGER PRIMARY KEY,
            areaNo INTEGER NOT NULL,
            lastInvoiceDate,
            company TEXT NOT NULL,
            contact TEXT,
            email TEXT,
            phone TEXT,
            terms TEXT,
            type TEXT,
            addr1 TEXT,
            addr2 TEXT
            );`,
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
            totalItems_adjup,
            totalVat REAL,
            totalVat_adjdown REAL,
            totalVat_adjup REAL,
            FOREIGN KEY (custNo) REFERENCES customers(id) ON DELETE CASCADE
            );`,
                `CREATE TABLE IF NOT EXISTS invoiceitems(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemNo INTEGER NOT NULL,
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
           `CREATE TABLE IF NOT EXISTS inventory(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemNo INTEGER NOT NULL,
            qty REAL NOT NULL,
            price REAL NOT NULL,
            frequency NULLABLE,
            storedPrice REAL NOT NULL,
            packs REAL NOT NULL,
            numPerPack REAL NOT NULL
            );`,
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