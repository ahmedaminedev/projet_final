import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CatalogService } from './catalog.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FavoriteService } from '../favorite/favorite.service';
import { HeaderService } from '../layouts/header/header.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css'],
  standalone: true,
  imports: [CommonModule,RouterModule],
})
export class CatalogComponent implements OnInit {
  public uniqueSuppliers: string[] = [];
  products: any[] = [];
  categoryId: number | null = null;
  currentPage: number = 1;
  productsPerPage: number = 21;
  paginatedProducts: any[] = [];
  staticRatings = [4, 3, 5, 2, 4, 3, 5, 1, 4, 2];
  filteredAttributes: any = {};
  priceRange = { min_price: 0, max_price: 1000 };
  selectedMinPrice: number = this.priceRange.min_price;
  selectedMaxPrice: number = this.priceRange.max_price;
  selectedAttributes: any = {};
  isDropdownOpen = false; // Variable pour suivre l'état du dropdown
  errorMessage: string = ''; // Variable pour le message d'erreur
  produitId: number | null = null;
  userRole: string | null = null;
  currentUser = this.authService.currentUserValue;
  constructor(private authService: AuthService,private catalogService: CatalogService,private headerService: HeaderService, private route: ActivatedRoute,private cdr: ChangeDetectorRef,private favoriteService: FavoriteService,) {}

  ngOnInit(): void {
    this.userRole = this.currentUser.user.role;

    this.route.params.subscribe(params => {
      this.categoryId = +params['categoryId'];
      this.loadFilteredAttributes();
      this.loadPriceRange();
      this.cdr.detectChanges(); // Ensure Angular detects the changes

    });

  }

  updateMinValue(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedMinPrice = Number(input.value);
    this.applyFilters();
  }

  updateMaxValue(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedMaxPrice = Number(input.value);
    this.applyFilters();
    }

    toggleAttributeFilter(attribute: string, value: string) {
      const formattedValue = value.replace(/ /g, '-');

      if (!this.selectedAttributes[attribute]) {
        this.selectedAttributes[attribute] = new Set();
      }

      if (this.selectedAttributes[attribute].has(formattedValue)) {
        this.selectedAttributes[attribute].delete(formattedValue);
      } else {
        this.selectedAttributes[attribute].add(formattedValue);
      }

      // Forcer la détection des changements après la modification
      this.cdr.detectChanges();

      this.applyFilters();
    }


  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen; // Inverse l'état du dropdown
  }

  trackByFn(index: number, item: any): any {
    return item;
  }

  applyFilters() {
    if (this.categoryId !== null) {
      const filters: any = {};

      // Construire les filtres dynamiquement à partir des attributs sélectionnés
      for (const attribute in this.selectedAttributes) {
        if (this.selectedAttributes.hasOwnProperty(attribute)) {
          filters[attribute] = Array.from(this.selectedAttributes[attribute]);
        }
      }

      // Ajouter les filtres de prix
      filters.prixMin = this.selectedMinPrice;
      filters.prixMax = this.selectedMaxPrice;

      console.log("Filtres appliqués :", filters); // Afficher les filtres appliqués

      this.catalogService.searchProductsByCategory(this.categoryId, filters).subscribe(
        (response) => {
          if (response && response.products) {
            if (Array.isArray(response.products) && response.products.length > 0) {
              this.products = response.products.map((product, index) => ({
                ...product,
                rating: this.staticRatings[index % this.staticRatings.length],
                reviews: Math.floor(Math.random() * 100) + 1
              }));
              // Extraire les fournisseurs uniques
              this.uniqueSuppliers = Array.from(new Set(this.products.map(product => product.site)));

              // Afficher les fournisseurs uniques
              console.log('Fournisseurs uniques:', Array.from(this.uniqueSuppliers));

              // Appliquer la pagination
              this.applyPagination();
              this.errorMessage = ''; // Réinitialiser le message d'erreur si des produits sont trouvés
            }
          } else {
            console.error('Les données reçues ne contiennent pas un tableau sous la clé "products".');
            this.errorMessage = 'aucun produit'; // Message d'erreur générique
          }
        },
        (error) => {
          console.error('Erreur lors de la récupération des produits filtrés', error);
          this.errorMessage = 'Erreur lors de la récupération des produits'; // Message d'erreur en cas d'exception
        }
      );
    }
  }


  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);
  }

  setPage(page: number): void {
    if (page < 1 || page > this.getTotalPages()) {
      return;
    }
    this.currentPage = page;
    this.applyPagination();
  }

  getTotalPages(): number {
    return Math.ceil(this.products.length / this.productsPerPage);
  }

  getPagesToShow(): number[] {
    const totalPages = this.getTotalPages();
    const pages = [];
    const range = 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 4) {
        pages.push(-1);
      }

      for (let i = Math.max(2, this.currentPage - range); i <= Math.min(totalPages - 1, this.currentPage + range); i++) {
        pages.push(i);
      }

      if (this.currentPage < totalPages - 3) {
        pages.push(-1);
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }

  shouldShowFirstEllipsis(): boolean {
    return this.currentPage > 4;
  }

  shouldShowLastEllipsis(): boolean {
    return this.currentPage < this.getTotalPages() - 3;
  }

  shouldShowFirstPage(): boolean {
    return this.getTotalPages() > 1 && this.currentPage > 4;
  }

  shouldShowLastPage(): boolean {
    return this.getTotalPages() > 1 && this.currentPage < this.getTotalPages() - 3;
  }

  loadPriceRange(): void {
    if (this.categoryId !== null) {
      this.catalogService.getPriceRangeByCategory(this.categoryId).subscribe(
        (response) => {
          this.priceRange = response;
          console.log("sssssssss",response)
          this.selectedMinPrice = response.min_price;
          this.selectedMaxPrice = response.max_price;
          this.applyFilters();        },
        (error) => {
          console.error('Erreur lors de la récupération de la plage de prix', error);
        }
      );
    }
  }

  loadFilteredAttributes(): void {
    if (this.categoryId !== null) {
      this.catalogService.getFilteredAttributesByCategory(this.categoryId).subscribe(
        (response) => {
          console.log('Filtered Attributes:', response); // Ajoutez cette ligne pour vérifier les données
          this.filteredAttributes = response;
          this.applyFilters();        },
        (error) => {
          console.error('Erreur lors de la récupération des attributs de filtrage', error);
        }
      );
    }
  }


  addToFavorites(productId: number): void {
    this.favoriteService.addToFavorites(productId).subscribe(
      (response) => {
        console.log('Produit ajouté aux favoris:', response);
        this.headerService.updateFavoritesCount();      },
      (error) => {
        console.error('Erreur lors de l\'ajout aux favoris:', error);
      }
    );
  }

    // Vérifier le rôle de l'utilisateur
    isRole(role: string): boolean {
      return this.userRole === role;
    }

    // Vérifier si l'utilisateur est connecté
    isLoggedIn(): boolean {
      return this.userRole !== null;
    }
}
