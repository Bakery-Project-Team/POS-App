import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NavController, LoadingController } from '@ionic/angular';
import { Network } from '@capacitor/network'
import { NyxPrinter } from 'nyx-printer/src';
import { Toast } from '@capacitor/toast';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {
  printerName: string = "default";
  printerStatus: string = 'default';
  wifiStatus: string = 'default';
  paymentTerminalName: string = "default";
  paymentTerminalStatus: string = "default";

  printStatus: boolean = false;
  paymentStatus: boolean = false;

  constructor(private navCtrl: NavController, private zone: NgZone, private loadingCtrl: LoadingController) {}

  goBack() {
    setTimeout(() => {
      this.navCtrl.back();
    }, 200)
  }

  async ngOnInit() {
    await Network.addListener('networkStatusChange', status => {
      this.zone.run(() => {
        this.wifiStatus = status.connected ? 'Connected' : 'Disconnected';
      });
    });

    await Network.getStatus().then(currentStatus => {
      this.wifiStatus = currentStatus.connected ? 'Connected' : 'Disconnected';
    });
    
    this.zone.run(async () => {
      await this.getPrinterModel();
      await this.updatePrinterStatus();
    })
  }

  async ngOnDestroy() {
    await Network.removeAllListeners();
  }

  async updatePrinterStatus() {
    try {
      const res = await NyxPrinter.getPrinterStatus();
      this.printerStatus = getPrinterStatus(res.status);
    } catch (err) {
      this.printerStatus = 'Error';
    }
  }

  async getPrinterModel() {
    try {
      const res = await NyxPrinter.getPrinterModel();
      this.printerName = res.model;
    } catch (err) {
      this.printerName = 'Unknown';
    }
  }

  async restartPrintService() {
    const loading = await this.loadingCtrl.create({
      message: "Restarting Printer Service",
      spinner: 'crescent',
      backdropDismiss: false
    });
    await loading.present();

    try {
      const res = await NyxPrinter.restartPrinter();
      if (res.success) {
        this.printStatus = true;

        const status = await NyxPrinter.getPrinterStatus();
        this.printerStatus = getPrinterStatus(status.status);
      }
    } catch {
      await Toast.show({text: "Failed to restart printer"});
      this.printStatus = false;
    }
    await loading.dismiss();
  }

  async refreshWiFiStatus() {
    await Network.getStatus().then(currentStatus => {
      this.wifiStatus = currentStatus.connected ? 'Connected' : 'Disconnected';
    });
  }
}

function getPrinterStatus(code: number): string {
  switch (code) {
    case 0: return 'Ready';
    case 1: return 'Printing';
    case 2: return 'Paper out';
    case 3: return 'Overheated';
    default: return 'Unknown / Not Connected';
  }
}
