import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { PopoverController } from "@ionic/angular";

@Component({
  selector: 'app-filter-popover',
  templateUrl: './filter-popover.component.html',
  styleUrls: ['./filter-popover.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class FilterPopoverComponent {
  startDate = '';
  endDate = '';
  date = '';
  showDateRange = false;
  showSingleDatePicker = false;

  constructor(private popOverController: PopoverController) { }

  selectFilter(option: string) {
    if (option === "Range") {
      this.showDateRange = true;
    } else if (option === "Date") {
      this.showSingleDatePicker = true;
    } else {
      this.popOverController.dismiss({ filter: option}, 'confirm');
    }
  }

  applyRange() {
    if (this.startDate && this.endDate) {
      this.popOverController.dismiss(
        { filter: 'Range', start: this.startDate, end: this.endDate }, 'confirm');
    }
  }

  applyDate() {
    if (this.date) {
      this.popOverController.dismiss({
        filter: 'Specific Date', date: this.date }, 'confirm');
    }
  }
}
