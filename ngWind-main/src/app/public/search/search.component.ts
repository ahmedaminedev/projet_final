import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SearchService } from './search.service';
import { HeaderService } from '../layouts/header/header.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

interface GroupedDetails {
  [key: string]: string[];
}

interface SelectedAttributes {
  [key: string]: string[];
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SearchComponent implements OnInit {
  public uniqueSuppliers: string[] = [];
  products: any[] = [];
  categoryId: number | null = null;
  currentPage: number = 1;
  productsPerPage: number = 21;
  paginatedProducts: any[] = [];
  filteredAttributes: any = {};
  priceRange = { min_price: 0, max_price: 1000 };
  selectedMinPrice: number = this.priceRange.min_price;
  selectedMaxPrice: number = this.priceRange.max_price;
  selectedAttributes: SelectedAttributes = {};
  isDropdownOpen = false;
  errorMessage: string = '';
  produitId: number | null = null;
  searchResults: any[] = [];
  searchResultsOriginal: any[] = []; // Nouvelle propriété pour stocker les résultats d'origine
  searchString: string = '';

  minPrice: number = 0;
  maxPrice: number = 1000;
  sites: string[] = [];
  currentUser = this.authService.currentUserValue;
  userRole: string | null = null;

  public displayedAttributes: { [key: string]: string[] } = {};
  public showMoreAttributes: { [key: string]: boolean } = {};
  public readonly attributesPerPage = 6;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private searchService: SearchService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.userRole = this.currentUser?.user?.role;

    this.headerService.searchString$.subscribe(searchString => {
      this.searchString = searchString;
      this.onSearch();
    });
  }

  isRole(role: string): boolean {
    return this.userRole === role;
  }

  isLoggedIn(): boolean {
    return this.userRole !== null;
  }

  cleanFilterKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  cleanFilterValue(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  applyFilters(): void {
    let filteredProducts = [...this.searchResultsOriginal]; // Commencez à partir de la liste originale

    // Assurez-vous que les valeurs de prix sont valides
    if (this.selectedMinPrice > this.selectedMaxPrice) {
      console.warn("Min price cannot be greater than max price.");
      return; // Sortir si les prix ne sont pas valides
    }

    // Filtrage par prix
    filteredProducts = filteredProducts.filter(product =>
      product.prix >= this.selectedMinPrice && product.prix <= this.selectedMaxPrice
    );

    // Filtrage par attributs sélectionnés
    for (const [key, selectedValues] of Object.entries(this.selectedAttributes)) {
      if (selectedValues.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          const productValue = product[key] || (product.details && product.details[key]) || '';
          return selectedValues.some(selectedValue =>
            productValue.toString().toLowerCase().includes(selectedValue.toLowerCase())
          );
        });
      }
    }

    this.searchResults = filteredProducts; // Mettre à jour les résultats filtrés
    this.updatePagination();
    console.log("Filtered products:", filteredProducts);
  }

  onSearch(): void {
    this.searchService.searchAndGroupDetails(this.searchString).subscribe(
      response => this.handleSearchResponse(response),
      error => this.handleError(error)
    );
  }

  handleSearchResponse(response: any): void {
    this.searchResults = response.products.map((product: any) => ({
      ...product,
      id: product.id
    })) || [];

    // Garder une copie originale des résultats
    this.searchResultsOriginal = [...this.searchResults];

    this.priceRange = {
      min_price: response.min_price,
      max_price: response.max_price
    };
    this.selectedMinPrice = this.priceRange.min_price;
    this.selectedMaxPrice = this.priceRange.max_price;
    this.sites = response.sites || [];
    this.filteredAttributes = this.filterGroupedDetails(response.grouped_details) || {};
    this.initializeDisplayedAttributes();
    this.errorMessage = '';

    if (this.searchString.trim() !== '') {
      if (this.searchResults.length > 0) {
        this.handleSearchSuccess();
      } else {
        this.handleNoResults();
      }
    }

    this.updatePagination();
  }

  initializeDisplayedAttributes(): void {
    this.displayedAttributes = {};
    this.showMoreAttributes = {};

    Object.keys(this.filteredAttributes).forEach(attribute => {
      const allValues = this.filteredAttributes[attribute];
      this.displayedAttributes[attribute] = allValues.slice(0, this.attributesPerPage);
      this.showMoreAttributes[attribute] = allValues.length > this.attributesPerPage;
    });
  }

  showMore(attribute: string): void {
    const allValues = this.filteredAttributes[attribute];
    this.displayedAttributes[attribute] = allValues;
    this.showMoreAttributes[attribute] = false;
  }

  showLess(attribute: string): void {
    const allValues = this.filteredAttributes[attribute];
    this.displayedAttributes[attribute] = allValues.slice(0, this.attributesPerPage);
    this.showMoreAttributes[attribute] = allValues.length > this.attributesPerPage;
  }

  filterGroupedDetails(groupedDetails: any): GroupedDetails {
    const { min_price, max_price, sites, ...dynamicDetails } = groupedDetails;
    const processedDetails: GroupedDetails = Object.keys(dynamicDetails).reduce((acc, key) => {
      const values = dynamicDetails[key] as string[];
      const lowerCaseValues = values.map((value: string) => value.toLowerCase());
      acc[key] = [...new Set(lowerCaseValues)];
      return acc;
    }, {} as GroupedDetails);

    return processedDetails;
  }

  handleSearchSuccess(): void {
    Swal.fire({
      icon: 'success',
      title: 'Recherche réussie',
      text: `${this.searchResults.length} résultats trouvés pour "${this.searchString}".`,
    });
  }

  handleNoResults(): void {
    Swal.fire({
      icon: 'info',
      title: 'Aucun résultat',
      text: `Aucun produit trouvé pour "${this.searchString}".`,
    });
  }

  handleError(error: any): void {
    console.error('Search error:', error);
    this.searchResults = [];
    this.errorMessage = 'Une erreur est survenue lors de la recherche.';
    Swal.fire({
      icon: 'error',
      title: 'Erreur de recherche',
      text: error.message || 'Une erreur inconnue est survenue.',
    });
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.productsPerPage;
    const end = start + this.productsPerPage;
    this.paginatedProducts = this.searchResults.slice(start, end);
  }

  setPage(page: number): void {
    if (page < 1 || page > this.getTotalPages()) {
      return;
    }
    this.currentPage = page;
    this.applyPagination();
  }

  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    this.paginatedProducts = this.searchResults.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.searchResults.length / this.productsPerPage);
  }

  updateMinValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedMinPrice = Number(input.value);
    console.log("Min Price Updated:", this.selectedMinPrice);
    this.applyFilters();
  }

  updateMaxValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedMaxPrice = Number(input.value);
    console.log("Max Price Updated:", this.selectedMaxPrice);
    this.applyFilters();
  }

  toggleAttributeFilter(attribute: string, item: string): void {
    if (!this.selectedAttributes[attribute]) {
      this.selectedAttributes[attribute] = [];
    }
    const index = this.selectedAttributes[attribute].indexOf(item);
    if (index > -1) {
      this.selectedAttributes[attribute].splice(index, 1);
    } else {
      this.selectedAttributes[attribute].push(item);
    }
    this.applyFilters();  // Apply filters after attribute selection
  }

  addToFavorites(productId: number): void {
    console.log(`Ajout du produit ${productId} aux favoris.`);
  }

  getFilteredAttributeKeys(): string[] {
    return Object.keys(this.filteredAttributes);
  }

  trackByFn(index: number, item: any): any {
    return item.id;
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
      let startPage = Math.max(1, this.currentPage - range);
      let endPage = Math.min(totalPages, this.currentPage + range);

      if (startPage <= 2) {
        endPage = Math.min(5, totalPages);
      }

      if (endPage >= totalPages - 1) {
        startPage = Math.max(1, totalPages - 4);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (startPage > 2) {
        pages.unshift(1);
        if (startPage > 3) {
          pages.splice(1, 0, -1); // "..." placeholder
        }
      }

      if (endPage < totalPages - 1) {
        pages.push(totalPages);
        if (endPage < totalPages - 2) {
          pages.splice(pages.length - 1, 0, -1); // "..." placeholder
        }
      }
    }

    return pages;
  }
}
