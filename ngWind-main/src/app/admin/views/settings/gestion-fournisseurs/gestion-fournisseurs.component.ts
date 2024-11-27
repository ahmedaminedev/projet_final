import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { pageTransition } from 'src/app/shared/utils/animations';
import { NgClass, NgIf } from '@angular/common';
import { DataTableComponent } from 'src/app/shared/components/data-table/data-table.component';
import { User } from 'src/app/auth/Model/User.model';
import { AdminService } from 'src/app/admin/admin.service';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-gestion-fournisseurs',
  animations: [pageTransition],
  imports: [NgClass, DataTableComponent, FormsModule, NgIf],
  standalone: true,
  templateUrl: './gestion-fournisseurs.component.html',
  styleUrls: ['./gestion-fournisseurs.component.css']
})
export class GestionFournisseursComponent implements OnInit {

  columnData = [
    { name: 'id', key: 'id' },
    { name: 'Username', key: 'username' },
    { name: 'Email', key: 'email' },
    { name: 'Localisation', key: 'localisation' },
    { name: 'Site Web', key: 'siteweb' },
    { name: 'Confirmation', key: 'etatConfirmation' }
  ];

  currentImage: string = '';
  currentUser = this.authService.currentUserValue;
  userRole: string | null = null;
  rowData: User[] = [];
  pageData = [1, 2, 3, 4, 5];

  actions = [
    { name: 'Edit', handler: (row: User) => this.editSupplier(row), class: 'btn-edit' },
    { name: 'Delete', handler: (row: User) => this.deleteSupplier(row), class: 'btn-delete' },
    { name: 'confirm', handler: (row: User) => this.validateSupplier(row), class: 'btn-validate' },
  ];

  supplierData: User = {
    id: 0,
    refreshToken: '',
    nom: '',
    prenom: '',
    username: '',
    email: '',
    password: '',
    numTel: '',
    localisation: '',
    siteweb: '',
    role: 'FOURNISSEUR',
    etatConfirmation: 'EN_ATTENTE'
  };

  isEditing = false;
  isFormVisible = false;

  constructor(private adminService: AdminService,private authService: AuthService) { }

  ngOnInit(): void {
    this.fetchSuppliers();
    this.currentUser = this.authService.currentUserValue;
    this.userRole = this.currentUser.user.role;
    console.log(this.userRole)
    console.log(this.currentUser.user.id)
  }

  fetchSuppliers(): void {
    this.adminService.getSuppliers().subscribe(
      (data: User[]) => {
        console.log('Suppliers data:', data);
        this.rowData = data;
      },
      (error) => {
        console.error('Error fetching suppliers:', error);
      }
    );
  }

  getEtatConfirmationClass(status: string) {
    return {
      'bg-yellow-500': status === 'EN_ATTENTE',
      'bg-green-500': status === 'CONFIRMEE',
      'bg-red-500': status === 'REFUSEE',
    };
  }

  openForm() {
    this.isFormVisible = true;
    this.isEditing = false;
    this.supplierData = {
      id: 0,
      refreshToken: '',
      nom: '',
      prenom: '',
      username: '',
      email: '',
      password: '',
      numTel: '',
      localisation: '',
      siteweb: '',
      role: 'FOURNISSEUR',
      etatConfirmation: 'EN_ATTENTE'
    };
  }

  editSupplier(row: User) {
    this.isFormVisible = true;
    this.isEditing = true;
    this.supplierData = { ...row };
  }

  submitForm() {
    if (this.isEditing) {
        console.log('Updating supplier:', this.supplierData);
        this.adminService.updateUser(this.supplierData.username!, {
            nom: this.supplierData.nom,
            prenom: this.supplierData.prenom,
            email: this.supplierData.email,
            numTel: this.supplierData.numTel,
            localisation: this.supplierData.localisation,
            siteweb: this.supplierData.siteweb,
            password: this.supplierData.password,
            etatConfirmation: this.supplierData.etatConfirmation || 'CONFIRMEE' // Défini par défaut à 'CONFIRMEE'
        }).subscribe(
            response => {
                console.log('Supplier updated successfully:', response);
                // Update the supplier in rowData
                const index = this.rowData.findIndex(s => s.username === this.supplierData.username);
                if (index !== -1) {
                    this.rowData[index] = { ...this.supplierData };
                }
                this.isFormVisible = false; // Hide form after submission

                // Show success message
                Swal.fire('Succès', 'Fournisseur mis à jour avec succès.', 'success');
            },
            error => {
                console.error('Error updating supplier:', error);
                Swal.fire('Erreur', error.message, 'error');
            }
        );
    } else {
        console.log('Adding new supplier:', this.supplierData);
        const { refreshToken, ...supplierToAdd } = this.supplierData;
        // Assurez-vous que etatConfirmation est défini par défaut
        supplierToAdd.etatConfirmation = 'CONFIRMEE';
        this.adminService.addUser(supplierToAdd)
            .subscribe(
                response => {
                    console.log('Supplier added successfully:', response);

                    // Add the new supplier to rowData using the data returned by the API
                    if (response.data) {
                        this.rowData.push(response.data); // Assuming response.data contains the new supplier
                    }

                    this.isFormVisible = false; // Hide form after submission

                    // Show success message
                    Swal.fire('Succès', 'Fournisseur ajouté avec succès.', 'success');
                },
                error => {
                    console.error('Error adding supplier:', error);
                    Swal.fire('Erreur', error.message, 'error');
                }
            );
    }
}


  cancelEdit() {
    this.isFormVisible = false; // Hide form without saving
  }


  deleteSupplier(row: User) {
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
              console.log('Fournisseur supprimé avec succès:', response);
              // Rafraîchir la liste des fournisseurs après suppression
              this.fetchSuppliers();
              // Afficher un message de succès
              Swal.fire(
                'Supprimé !',
                'Le fournisseur a été supprimé.',
                'success'
              );
            },
            error => {
              console.error('Erreur lors de la suppression du fournisseur:', error);
              // Afficher un message d'erreur
              Swal.fire(
                'Erreur',
                'Une erreur est survenue lors de la suppression du fournisseur.',
                'error'
              );
            }
          );
        }
      });
    } else {
      console.error('L\'ID du fournisseur est indéfini');
    }
  }

  validateSupplier(row: User) {
    if (row.username) {
      console.log('Validating supplier:', row);
      // Appeler le service pour mettre à jour l'état de confirmation
      this.adminService.updateUserConfirmationState(row.username).subscribe(
        response => {
          console.log('Supplier confirmation updated successfully:', response);
          Swal.fire('Succès', 'Le fournisseur a été confirmé avec succès.', 'success');
          // Mettre à jour l'état de confirmation dans la liste des fournisseurs
          row.etatConfirmation = 'CONFIRMEE';
        },
        error => {
          console.error('Error updating supplier confirmation:', error);
          Swal.fire('Erreur', 'Une erreur est survenue lors de la confirmation du fournisseur.', 'error');
        }
      );
    } else {
      console.error('Username is undefined');
      Swal.fire('Erreur', 'Le nom d\'utilisateur est manquant pour ce fournisseur.', 'error');
    }
  }


}
