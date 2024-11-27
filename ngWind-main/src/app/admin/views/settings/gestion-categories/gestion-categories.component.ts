// gestion-pages.component.ts
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { CatgoriepageService } from './catgoriepage.service';
import { Categorie } from 'src/app/auth/Model/categorie.model';
import { pageTransition } from 'src/app/shared/utils/animations';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-categories',
  templateUrl: './gestion-categories.component.html',
  styleUrls: ['./gestion-categories.component.css'],
  imports: [NgClass, FormsModule, NgIf, NgFor],
  standalone: true,
  animations: [pageTransition],
})
export class GestionCategoriesComponent implements OnInit {
  isFormVisible: boolean = false;
  isEditing: boolean = false;

  categoryData: Categorie = {
    id: 0,
    name: '',
    parent_category: null,
  };

  categories: Categorie[] = [];

  constructor(private categorieService: CatgoriepageService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categorieService.getCategories().subscribe({
      next: (categories: Categorie[]) => {
        this.categories = categories;
      },
      error: (err) => {
        Swal.fire('Erreur', 'Erreur de chargement des catégories', 'error');
        console.error('Error loading categories', err);
      }
    });
  }

  getParentCategories(): Categorie[] {
    return this.categories.filter(cat => cat.parent_category === null);
  }

  getSubCategories(parentId: number): Categorie[] {
    return this.categories.filter(cat => cat.parent_category === parentId ?? null);
  }

  toggleSubCategories(parentId: number): void {
    const subCategoriesElement = document.getElementById(`sub-categories-${parentId}`);
    if (subCategoriesElement) {
      subCategoriesElement.classList.toggle('hidden');
    }
  }

  openForm(): void {
    this.isFormVisible = true;
    this.isEditing = false;
    this.categoryData = {
      id: 0,
      name: '',
      parent_category: null,
    };
  }

  cancelEdit(): void {
    this.isFormVisible = false;
  }

  submitForm(): void {
    if (this.isEditing) {
      // Logique pour mettre à jour la catégorie
      Swal.fire('Erreur', 'Fonctionnalité de mise à jour non encore implémentée', 'error');
    } else {
      this.categorieService.addCategory(this.categoryData).subscribe({
        next: (newCategory) => {
          this.categories.push(newCategory);
          Swal.fire('Succès', 'Catégorie ajoutée avec succès', 'success');
        },
        error: (err) => {
          Swal.fire('Erreur',`${err}`, 'error');
          console.error('Error adding category', err);
        }
      });
      this.isFormVisible = false;
    }
  }

  deleteCategory(category: Categorie): void {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Cette action supprimera définitivement la catégorie!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      console.log(result)
      if (result.isConfirmed) {
        this.categorieService.deleteCategory(category.id).subscribe({
          next: () => {
            // Mise à jour de l'interface utilisateur après succès
            this.loadCategories(); // Recharger les catégories
            Swal.fire('Supprimé!', 'Catégorie supprimée avec succès', 'success');
          },
          error: (err) => {
            console.log(err)
            Swal.fire('Erreur', `${err}`, 'error');
            console.error('Error deleting category', err);
          }
        });
      }
    });
  }

}
