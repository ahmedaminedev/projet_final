import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IColumn } from 'src/app/auth/Model/i-column';

@Component({
  selector: 'data-table',
  standalone: true,
  imports: [CommonModule, NgClass, NgIf],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent {
  @Input() columnData: IColumn[] = [];
  @Input() rowData: any[] = [];
  @Input() pageData: number[] = [];
  @Input() actions: { name: string; handler: (row: any) => void }[] = [];

  shorting: boolean = false;
  tooltipVisible: boolean = false;
  tooltipText: string = '';
  tooltipStyle: any = {};

  sortingUp() {
    this.shorting = !this.shorting;
  }

  sortingDown() {
    this.shorting = !this.shorting;
  }

  showTooltip(event: MouseEvent, text: string) {
    this.tooltipText = text;
    this.tooltipStyle = {
      left: `${event.pageX}px`,
      top: `${event.pageY + 20}px`, // Ajustez la position selon vos besoins
    };
    this.tooltipVisible = true;
  }

  hideTooltip() {
    this.tooltipVisible = false;
  }

  getEtatConfirmationClass(status: string) {
    console.log('etatConfirmation:', status); // Debugging line
    return {
      'bg-orange-500': status === 'EN_ATTENTE',
      'bg-green-500': status === 'CONFIRMEE',
      'bg-red-500': status === 'REFUSEE',
    };
  }
  getEtatServiceClass(status: string) {
    return {
      'bg-orange-500': status === 'EN_ATTENTE',
      'bg-green-500': status === 'TERMINER',
    };
  }

//Detail Add Configuration
  getButtonClass(actionName: string): string {
    switch (actionName) {
      case 'Edit':
        return 'edit';
      case 'Detail':
        return 'detail';
      case 'Add Configuration':
          return 'addconfig';
      case 'Delete':
        return 'delete';
      case 'confirm':
        return 'validate';
        case 'Scrape':
          return 'scrape';
      default:
        return '';
    }
  }
}
