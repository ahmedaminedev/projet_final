import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { GestionProduitsPagesService } from './gestion-produits-pages.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface Product {
  id:number;
  nom: string;
  prix: number;
  prix_regulier: number;
  description: string;
  image: string;  // Assurez-vous que l'image est définie ici
}

@Component({
  selector: 'app-gestion-produits-pages',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './gestion-produits-pages.component.html',
  styleUrls: ['./gestion-produits-pages.component.css']
})
export class GestionProduitsPagesComponent implements OnInit {
  pageId: number | null = null;
  page: any = {};
  products: Product[] = [];
  isFormVisible = false
  productToEdit: Product | null = null
  isEditMode: boolean = false

  private activeMenuProduct: Product | null = null;

  constructor(private route: ActivatedRoute, private productservice: GestionProduitsPagesService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.pageId = +params['pageId'] || null;
      if (this.pageId !== null) {
        this.loadproducts_from_page(this.pageId).subscribe();
      } else {
        console.error('Page ID est null');
      }
    });
  }

  loadproducts_from_page(pageId: number): Observable<boolean> {
    return this.productservice.get_products_page(pageId).pipe(
      map(response => {
        this.page = response.page;
        this.products = response.products;
        console.log(response);
        return true;
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des produits :', error);
        return of(false);
      })
    );
  }

  // Vérifie si le menu des actions est ouvert pour un produit donné
  isMenuOpen(product: Product): boolean {
    return this.activeMenuProduct === product;
  }

  // Affiche ou masque le menu d'actions
  toggleActionsMenu(product: Product) {
    if (this.activeMenuProduct === product) {
      this.activeMenuProduct = null;  // Masquer si le même produit est cliqué à nouveau
    } else {
      this.isEditMode = true
      this.activeMenuProduct = product;  // Activer pour le produit sélectionné
    }
  }


  product: Product ={
    id:0,
    nom: "",
    prix: 0,
    prix_regulier: 0,
    description: "",
    image: ""  // Assurez-vous que l'image est définie ici
  }

  cancelEdit () {
    this.isFormVisible = false
    this.productToEdit = null
    this.isEditMode = false
  }

  openForm(product?: Product) {
    this.isFormVisible = true; // Affiche le formulaire
    if (product) {
      this.isEditMode = true;
      this.productToEdit = product;
      this.product = { ...product }; // Clone les données du produit pour éviter de modifier directement l'original
    } else {
      this.isEditMode = false;
      this.product = {
        id: 0,
        nom: "",
        prix: 0,
        prix_regulier: 0,
        description: "",
        image: ""
      };
    }
  }

  submitForm() {
    // Validation des champs obligatoires
    if (!this.product.nom) {
      Swal.fire('Erreur', 'Le nom du produit est obligatoire.', 'error');
      return;
    }

    if (this.product.prix <= 0) {
      Swal.fire('Erreur', 'Le prix du produit doit être supérieur à zéro.', 'error');
      return;
    }

    if (this.isEditMode && this.productToEdit) {
      // Mise à jour d'un produit existant
      this.productservice.updateProduct(this.product.id, this.product).subscribe(
        () => {
          // Mettre à jour directement le produit dans le tableau local
          const index = this.products.findIndex(p => p.id === this.product.id);
          if (index !== -1) {
            this.products[index] = { ...this.product }; // Mettez à jour le produit modifié dans le tableau
          }

          Swal.fire('Succès', 'Produit mis à jour avec succès.', 'success');
          this.isFormVisible = false; // Fermer le formulaire
        },
        error => {
          Swal.fire('Erreur', `Échec de la mise à jour du produit: ${error}`, 'error');
        }
      );
    }
  }


deleteAllProducts(): void {
  if (this.pageId !== null) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Voulez-vous vraiment supprimer tous les produits de la page ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer tout',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productservice.deleteAllProductFromPage(this.pageId!).subscribe(
          () => {
            this.products = []; // Vider la liste des produits localement après la suppression
            Swal.fire('Succès', 'Tous les produits ont été supprimés avec succès.', 'success');
          },
          error => {
            Swal.fire('Erreur', `Échec de la suppression des produits: ${error}`, 'error');
          }
        );
      }
    });
  } else {
    Swal.fire('Erreur', 'Page ID est invalide.', 'error');
  }
}



deleteProduct(productId: number, productName: string): void {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: `Voulez-vous vraiment supprimer le produit n°${productId} (${productName}) ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
  }).then((result) => {
    if (result.isConfirmed) {
      this.productservice.deleteProductById(productId).subscribe(
        () => {
          // Filtrer le produit supprimé dans la liste locale
          this.products = this.products.filter(product => product.id !== productId);
          Swal.fire('Succès', 'Le produit a été supprimé avec succès.', 'success');
        },
        error => {
          Swal.fire('Erreur', `Échec de la suppression du produit: ${error}`, 'error');
        }
      );
    }
  });
}


}
