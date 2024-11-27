import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { FournisseurStatsService } from './fournisseur-stats.service';
import { Chart, registerables } from 'chart.js';

interface ProductData {
  total_favorites?: number;
  total_visits?: number;
  percentage?: number;
}

interface CategoryData {
  total_favorites?: number;
  total_visits?: number;
  products?: { [key: string]: ProductData };
  [key: string]: any; // Allow indexing by string
}

@Component({
  selector: 'app-fournisseur-stats',
  standalone: true,
  templateUrl: './fournisseur-stats.component.html',
  styleUrls: ['./fournisseur-stats.component.css'],
  imports: [CommonModule],
})
export class FournisseurStatsComponent implements OnInit {
  currentUser: any;
  site_name: string | null = null;
  stats: { [key: string]: CategoryData } = {};
  categories: string[] = []; // To hold the category names for dynamic chart generation
  favoritesCharts: Chart[] = []; // Array to hold favorites charts
  visitorsCharts: Chart[] = []; // Array to hold visitors charts

  constructor(
    private authService: AuthService,
    private fournisseurStatsService: FournisseurStatsService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.site_name = this.currentUser.user.username;
    this.loadStats();
  }

  loadStats(): void {
    if (this.site_name) {
      this.fournisseurStatsService.getTop15FavoritesByCategoryBySite(this.site_name).subscribe(
        (data) => {
          console.log('Favorites Stats Data:', data);
          this.stats['favorites'] = data;
          this.populateFavoritesCharts();
        },
        (error) => {
          console.error('Error fetching favorites stats', error);
        }
      );

      this.fournisseurStatsService.getTop15VisiteurByCategoryBySite(this.site_name).subscribe(
        (data) => {
          console.log('Visitors Stats Data:', data);
          this.stats['visitors'] = data;
          this.populateVisitorsCharts();
        },
        (error) => {
          console.error('Error fetching visitors stats', error);
        }
      );
    }
  }

  private populateFavoritesCharts(): void {
    const favoritesData = this.stats['favorites'];
    const favoriteColor = '#f7bd5e'; // Color for favorite products

    if (favoritesData) {
      this.categories = Object.keys(favoritesData);
      this.favoritesCharts = [];

      this.categories.forEach((category) => {
        const products = favoritesData[category]?.products || {};
        const labels = Object.keys(products).map((_, i) => (i + 1).toString()); // Display 1, 2, 3, ...
        const data = Object.values(products).map((product) => (product as ProductData).percentage || 0);

        setTimeout(() => {
          this.favoritesCharts.push(
            this.createChart(`favoritesChartCanvas-${category}`, labels, data, 'Produits Favoris (%)', Object.keys(products), favoriteColor)
          );
        });
      });
    } else {
      console.warn('No favorites data available');
    }
  }

  private populateVisitorsCharts(): void {
    const visitorsData = this.stats['visitors'];
    const visitorColor = '#ff2222'; // Couleur pour les données de visiteurs

    if (visitorsData) {
      this.visitorsCharts = [];
      console.log('Visitors Data:', visitorsData); // Log des données visiteurs

      this.categories.forEach((category) => {
        const products = visitorsData[category]?.products || {};
        console.log('Products for category:', category, products); // Log des produits par catégorie
        const labels = Object.keys(products).map((_, i) => (i + 1).toString());
        const data = Object.values(products).map((product) => (product as ProductData).total_visits || 0);
        console.log('Data for chart:', data); // Log des données pour le graphique

        setTimeout(() => {
          this.visitorsCharts.push(
            this.createChart(`visitorsChartCanvas-${category}`, labels, data, 'Visiteurs (%)', Object.keys(products), visitorColor)
          );
        });
      });
    } else {
      console.warn('No visitors data available');
    }
  }


  private createChart(canvasId: string, labels: string[], data: number[], chartLabel: string, productNames: string[], backgroundColor: string): Chart {
    const ctx = (document.getElementById(canvasId) as HTMLCanvasElement)?.getContext('2d');

    if (ctx) {
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels, // Display "1", "2", "3"... instead of full product names
          datasets: [{
            label: chartLabel,
            data,
            backgroundColor: backgroundColor, // Same background color for the category
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // Adjust the chart size
          devicePixelRatio: 2, // Ensure crisper rendering for high DPI screens
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              intersect: true, // Ensure tooltip only shows when hovering directly over the bar
              mode: 'nearest', // Show tooltip for the nearest hovered bar
              callbacks: {
                label: (tooltipItem) => {
                  const index = tooltipItem.dataIndex;
                  const value = data[index];
                  return `${productNames[index]}: ${value}`; // Show product name with value
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Produits', // X axis label
              },
              ticks: {
                callback: function(value, index) {
                  return index + 1; // Display 1, 2, 3... on the x-axis
                },
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Pourcentage / Nombre de visites', // Y axis label
              },
              ticks: {
                stepSize: 1,
              },
            },
          },
        },
      });
    }

    throw new Error(`Canvas context not found for id: ${canvasId}`);
  }
}
