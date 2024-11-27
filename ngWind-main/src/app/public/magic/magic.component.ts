import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { Chart, ChartConfiguration, ChartItem } from 'chart.js';
import 'chartjs-adapter-date-fns';  // Importer l'adaptateur de date
import { ChangeDetectorRef } from '@angular/core'; // Importer ChangeDetectorRef
import { ActivatedRoute, RouterModule } from '@angular/router'; // Importer ActivatedRoute
import { FavoriteService } from '../favorite/favorite.service';
import { HeaderService } from '../layouts/header/header.service';
import { DetailProductService } from '../detail-product/detail-product.service';
import { MagicSearchService } from './magic-search.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-magic',
  standalone: true,
  imports: [CarouselModule, CommonModule, RouterModule,FormsModule],
  templateUrl: './magic.component.html',
  styleUrl: './magic.component.css'
})

export class MagicComponent implements OnInit {



  currentUser = this.authService.currentUserValue;

  priceHistory: { dates: string[], new_prices: number[] } = { dates: [], new_prices: [] };
  private chart: Chart | undefined;
  infos: { key: string, value: any }[] = [];
  product: any = {};
  products: any[] = [];
  dates: any[] = [];
  produitId: number | null = null;
  productLink: string ='';
  isSearching: boolean = false; // Indique si la recherche est en cours
  productFound: boolean = false; // Indique si un produit a été trouvé
  favoritesCount: number | undefined ;
  customOptions: any = {};
  userRole: string | null = null;


  constructor(
    private favoriteService: FavoriteService, // Ajoutez ceci
    private detailProductService: DetailProductService,
    private magicservice: MagicSearchService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private headerService: HeaderService,
    private authService: AuthService,

  ) { }




  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.userRole = this.currentUser.user.role;

    if (this.produitId !== null) {
      this.loadProductDetails(this.produitId);
    }      this.setCarouselOptions();


  }
  searchProductByLink() {
    this.isSearching = true; // Lancer la recherche
    this.productFound = false; // Réinitialiser le statut du produit

    this.magicservice.getProductDetailsAndSimilarbylink(this.productLink).subscribe(
      (response) => {
        if (response && response.product) {
          this.produitId = response.product.id;
          this.productFound = true; // Un produit a été trouvé
          this.loadProductDetails(this.produitId!);
        } else {
          this.productFound = false; // Aucun produit trouvé
        }
        this.isSearching = false; // Recherche terminée
      },
      (error) => {
        console.error('Erreur lors de la récupération des détails du produit:', error);
        this.isSearching = false;
        this.productFound = false; // Aucun produit trouvé en cas d'erreur
      }
    );
  }



  setCarouselOptions() {
    const minItems = 3; // Nombre minimum d'éléments pour activer la boucle
    const itemCount = this.products.length;

    this.customOptions = {
      loop: itemCount > minItems, // Active la boucle uniquement si le nombre d'éléments est supérieur à minItems
      nav: true,
      dots: false,
      autoplay: true,
      autoplayTimeout: 4000,
      margin: 10,
      responsive: {
        0: { items: 1 },
        576: { items: 1 },
        768: { items: 2 },
        992: { items: 3 }
      }
    };
  }


  loadPriceHistory(productId: number): void {
    this.detailProductService.getPriceHistory(productId).subscribe(
      (data) => {
        this.priceHistory = data;
        this.dates = data.dates;

        console.log('Dates récupérées:', this.dates);
        console.log('Prix récupérés :', this.priceHistory.new_prices);

        // Appel à createPriceChart() uniquement après que les données sont récupérées
        this.createPriceChart();
      },
      (error) => {
        console.error('Erreur lors de la récupération de l\'historique des prix:', error);
      }
    );
  }

  loadProductDetails(productId: number): void {
    this.detailProductService.getProductDetailsAndSimilar(productId).subscribe(
      (data) => {
        this.product = data.product;
        this.dates = data.product.dates;

        console.log('Données du produit:', data);
        console.log('Prix régulier loadProductDetails :', this.product.prix_regulier);

        // Aplatir les produits similaires
        this.products = [
          ...data.similar_products.TechnoPro.map((p: { product: any; }) => p.product),
          ...data.similar_products.tunisianet.map((p: { product: any; }) => p.product),
          ...data.similar_products.Mytek.map((p: { product: any; }) => p.product)
        ];
        this.infos = this.getDetailsAsArray();

        // Charger l'historique des prix après avoir récupéré les détails du produit
        this.loadPriceHistory(this.produitId!);

        // Forcer la détection des changements
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Erreur lors de la récupération des détails du produit:', error);
      }
    );
  }

  getDetailsAsArray(): { key: string, value: any }[] {
    return Object.entries(this.product.details || {}).map(([key, value]) => ({ key, value }));
  }

  getInitialPrice(): number {
    console.log('Données du produit:', this.product);
    console.log('Prix régulier getInitialPrice:', this.product.prix_regulier);

    // Si prix régulier est défini et supérieur à 0
    if (this.product.prix_regulier != null && this.product.prix_regulier > 0) {
      console.log('Prix régulier utilisé:', this.product.prix_regulier);
      return this.product.prix_regulier;
    }

    // Utiliser le premier prix de l'historique si disponible
    const initialPrice = this.priceHistory.new_prices.length > 0 ? this.priceHistory.new_prices[0] : 0;
    console.log('Prix initial à partir de l\'historique:', initialPrice);
    return initialPrice;
  }





  createPriceChart(): void {
    if (this.chart) {
        this.chart.destroy();
    }

    const ctx = document.getElementById('priceChart') as ChartItem;

    if (!this.priceHistory.new_prices.length || !this.priceHistory.dates.length) {
        console.error('Les dates ou les prix sont vides.');
        return;
    }

    const generateDailyDates = (startDate: Date, endDate: Date) => {
        const dates = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1); // Incrémenter par jour
        }

        return dates;
    };

    const startDate = new Date('2024-08-01');
    const endDate = new Date(); // Utilisez la date actuelle pour la fin
    const labels = generateDailyDates(startDate, endDate);

    // Normaliser les dates
    const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const firstRealDate = normalizeDate(new Date(this.priceHistory.dates[0]));
    const initialPrice = this.getInitialPrice();

    let data: { x: number, y: number }[] = [];

    labels.forEach((labelDate) => {
        const normalizedLabelDate = normalizeDate(labelDate);

        if (normalizedLabelDate < firstRealDate) {
            // Utiliser le prix régulier pour les dates avant la première date réelle
            data.push({ x: labelDate.getTime(), y: initialPrice });
        } else {
            // Trouver l'index de la date dans les données historiques
            const indexInHistory = this.priceHistory.dates.findIndex(
                (d) => normalizeDate(new Date(d)).getTime() === normalizedLabelDate.getTime()
            );

            if (indexInHistory !== -1) {
                // Ajouter le prix correspondant à la date trouvée
                data.push({ x: labelDate.getTime(), y: this.priceHistory.new_prices[indexInHistory] });
            } else {
                // Utiliser le dernier prix connu ou le prix initial si aucune date ne correspond
                data.push({ x: labelDate.getTime(), y: data.length > 0 ? data[data.length - 1].y : initialPrice });
            }
        }
    });

    // Calculer les valeurs min et max dynamiques
    const minPrice = Math.min(...this.priceHistory.new_prices) - 50;
    const maxPrice = Math.max(...this.priceHistory.new_prices) + 50;

    const chartConfig: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
            labels: labels.map(date => date.toISOString()), // Convertir les dates en chaînes ISO pour les labels
            datasets: [{
                label: 'Prix au fil du temps',
                data: data, // Utiliser les données avec les timestamps numériques
                borderColor: '#fdc400',
                backgroundColor: 'rgba(253, 196, 0, 0.2)', // Opacité pour le remplissage
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    // ... other x-axis options
                },
                y: {
                    title: {
                        display: true,
                        text: 'Prix (DNT)'
                    },
                    beginAtZero: false,
                    min: minPrice, // Utiliser la valeur min dynamique
                    max: maxPrice  // Utiliser la valeur max dynamique
                }
            }
        }
    };

    this.chart = new Chart(ctx, chartConfig);
}



  isRole(role: string): boolean {
    return this.userRole === role;
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.userRole !== null;
  }


  addToFavorites(productId: number): void {
    this.favoriteService.addToFavorites(productId).subscribe(
      (response) => {
        console.log('Produit ajouté aux favoris:', response);
        this.headerService.updateFavoritesCount(); // Met à jour le compteur global
      },
      (error) => {
        console.error('Erreur lors de l\'ajout aux favoris:', error);
      }
    );
  }

  incrementVisitorsAndRedirect(): void {
    const productId = this.product?.id;
    const productLink = this.product?.link;

    if (productId) {
      this.detailProductService.incrementVisitors(productId).subscribe({
        next: (response) => {
          console.log('Nombre de visiteurs incrémenté avec succès:', response);
          if (productLink) {
            // Ouvre le lien du produit dans un nouvel onglet après que l'incrémentation a réussi
            window.open(productLink, '_blank');
          }
        },
        error: (err) => {
          console.error('Erreur lors de l\'incrémentation des visiteurs:', err);
          if (productLink) {
            // Ouvre le lien du produit dans un nouvel onglet même si l'incrémentation échoue
            window.open(productLink, '_blank');
          }
        }
      });
    }
  }

}
