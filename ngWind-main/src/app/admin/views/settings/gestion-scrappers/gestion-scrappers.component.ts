import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { pageTransition } from 'src/app/shared/utils/animations';
import { NgClass, NgIf } from '@angular/common';
import { DataTableComponent } from 'src/app/shared/components/data-table/data-table.component';
import { User } from 'src/app/auth/Model/User.model';
import { AdminService } from 'src/app/admin/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-scrappers',
  animations: [pageTransition],
  imports: [NgClass, DataTableComponent, FormsModule, NgIf],
  standalone: true,
  templateUrl: './gestion-scrappers.component.html',
  styleUrls: ['./gestion-scrappers.component.css']
})
export class GestionScrappersComponent implements OnInit {
  columnData = [
    { name: 'ID', key: 'id' },
    { name: 'Username', key: 'username' },
    { name: 'Email', key: 'email' },
    { name: 'Nom', key: 'nom' },
    { name: 'Prénom', key: 'prenom' },
    { name: 'Localisation', key: 'localisation' },
  ];

  rowData: User[] = [];
  pageData = [1, 2, 3, 4, 5];

  actions = [
    { name: 'Edit', handler: (row: User) => this.editScrapper(row), class: 'btn-edit' },
    { name: 'Delete', handler: (row: User) => this.deleteScrapper(row), class: 'btn-delete' },
  ];

  scrapperData: User = {
    id: 0,
    refreshToken: '',
    nom: '',
    prenom: '',
    username: '',
    email: '',
    password: '',
    numTel: '',
    localisation: '',
    role: 'SCRAPPER',
    etatConfirmation: '',  // Peut être null pour les scrappers
  };

  isEditing = false;
  isFormVisible = false;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.fetchScrappers();
  }

  fetchScrappers(): void {
    this.adminService.getScrappers().subscribe(
      (data: User[]) => {
        console.log('Scrappers data:', data);
        this.rowData = data;
      },
      (error) => {
        console.error('Error fetching scrappers:', error);
      }
    );
  }

  openForm() {
    this.isFormVisible = true;
    this.isEditing = false;
    this.scrapperData = {
      id: 0,
      refreshToken: '',
      nom: '',
      prenom: '',
      username: '',
      email: '',
      password: '',
      numTel: '',
      localisation: '',
      role: 'SCRAPPER',
    };
  }

  editScrapper(row: User) {
    this.isFormVisible = true;
    this.isEditing = true;
    this.scrapperData = { ...row };
  }

  submitForm() {
    if (this.isEditing) {
        console.log('Updating scrapper:', this.scrapperData);
        this.adminService.updateUser(this.scrapperData.username!, {
            nom: this.scrapperData.nom,
            prenom: this.scrapperData.prenom,
            email: this.scrapperData.email,
            numTel: this.scrapperData.numTel,
            localisation: this.scrapperData.localisation,
            password: this.scrapperData.password,
        }).subscribe(
            response => {
                console.log('Scrapper updated successfully:', response);
                // Met à jour le scrapper dans rowData
                const index = this.rowData.findIndex(s => s.username === this.scrapperData.username);
                if (index !== -1) {
                    this.rowData[index] = { ...this.scrapperData };
                }
                this.isFormVisible = false; // Masque le formulaire après soumission

                // Affiche un message de succès
                Swal.fire('Succès', 'Scrapper mis à jour avec succès.', 'success');
            },
            error => {
                console.error('Error updating scrapper:', error);
                Swal.fire('Erreur', error.message, 'error');
            }
        );
    } else {
        console.log('Adding new scrapper:', this.scrapperData);
        const { refreshToken, ...scrapperToAdd } = this.scrapperData;
        this.adminService.addUser(scrapperToAdd)
            .subscribe(
                response => {
                    console.log('Scrapper added successfully:', response);

                    // Ajoute le nouveau scrapper à rowData en utilisant les données retournées par l'API
                    if (response.data) {
                        this.rowData.push(response.data); // En supposant que response.data contient le nouveau scrapper
                    }

                    this.isFormVisible = false; // Masque le formulaire après soumission

                    // Affiche un message de succès
                    Swal.fire('Succès', 'Scrapper ajouté avec succès.', 'success');
                },
                error => {
                    console.error('Error adding scrapper:', error.error);
                    Swal.fire('Erreur', error.message, 'error');
                }
            );
    }
  }

  cancelEdit() {
    this.isFormVisible = false; // Masque le formulaire sans sauvegarder
  }

  deleteScrapper(row: User) {
    const id = row.id;

    if (id !== undefined) {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: 'Cette action est irréversible !',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer !',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          this.adminService.deleteUser(id, row.username!).subscribe(
            response => {
              console.log('Scrapper deleted successfully:', response);
              // Rafraîchit la liste des scrappers après suppression
              this.fetchScrappers();
              // Affiche un message de succès
              Swal.fire(
                'Supprimé !',
                'Le scrapper a été supprimé.',
                'success'
              );
            },
            error => {
              console.error('Error deleting scrapper:', error);
              // Affiche un message d'erreur
              Swal.fire(
                'Erreur',
                'Une erreur est survenue lors de la suppression du scrapper.',
                'error'
              );
            }
          );
        }
      });
    } else {
      console.error('ID du scrapper est indéfini');
    }
  }
}
