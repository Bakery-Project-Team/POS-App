export interface PrintTextOptions {
  text: string;
}

export interface PrintTextResult {
  result: number;
}

export interface PrinterStatusResult {
  status: number;
}

export interface IsReadyResult {
  connected: boolean;
}

export interface PrinterModelResult {
  result: number;
  model: string;
}

export interface NyxPrinterPlugin {
  isReady(): Promise<IsReadyResult>;
  printText(options: PrintTextOptions): Promise<PrintTextResult>;
  getPrinterStatus(): Promise<PrinterStatusResult>;
  restartPrinter(): Promise<{success: boolean}>;
  getPrinterModel(): Promise<PrinterModelResult>;
}