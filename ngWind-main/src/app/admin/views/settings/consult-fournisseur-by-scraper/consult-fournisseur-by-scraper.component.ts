import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/auth/Model/User.model'; // Adjust import path as needed
import { AdminService } from 'src/app/admin/admin.service'; // Adjust import path as needed
import { DataTableComponent } from 'src/app/shared/components/data-table/data-table.component';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-consult-fournisseur-by-scraper',
  standalone: true,
  imports: [NgClass, DataTableComponent, FormsModule, CommonModule],
  templateUrl: './consult-fournisseur-by-scraper.component.html',
  styleUrls: ['./consult-fournisseur-by-scraper.component.css']
})
export class ConsultFournisseurByScraperComponent implements OnInit {
  suppliers: User[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.fetchSuppliers();
  }

  fetchSuppliers(): void {
    this.adminService.getSuppliersConfimrmed().subscribe(
      (data: User[]) => {
        this.suppliers = data;
      },
      (error) => {
        console.error('Error fetching suppliers:', error);
      }
    );
  }
}
