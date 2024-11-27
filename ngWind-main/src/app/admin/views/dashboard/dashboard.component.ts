import { Component, OnInit } from '@angular/core';
import { Chart, registerables, TooltipItem } from 'chart.js';
import { DashboardService } from './dashboard.service';

interface ProductData {
  total_favorites?: number;
  total_baises?: number;
  total_visits?: number;
}

interface CategoryData {
  total_favorites?: number;
  total_baises?: number;
  total_visits?: number;
  products?: { [key: string]: ProductData };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  categoriesFavorites: { [key: string]: CategoryData } = {};
  categoriesBaise: { [key: string]: CategoryData } = {};
  categoriesVisiteur: { [key: string]: CategoryData } = {};
  topVisitedCategories: { [key: string]: ProductData } = {};

  constructor(private dashboardService: DashboardService) {
    Chart.register(...registerables); // Register the necessary Chart.js components
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.dashboardService.getTop15FavoritesByCategory().subscribe(data => {
      this.categoriesFavorites = data;
      this.createCategoryCharts('favoritesChart', 'Total Favorites by Product in Category', data, 'total_favorites');
    });

    this.dashboardService.getTop15VisiteurByCategory().subscribe(data => {
      this.categoriesVisiteur = data;
      this.createCategoryCharts('visitorsChart', 'Total Visitors by Product in Category', data, 'total_visits');
    });

    this.dashboardService.getTopVisitedCategories().subscribe(data => {
      this.topVisitedCategories = data;
      this.createPieChart('visitedCategoriesChart', 'Top Visited Categories', data);
    });
  }

  createCategoryCharts(chartId: string, label: string, data: { [key: string]: CategoryData }, dataKey: keyof ProductData): void {
    const container = document.getElementById(chartId) as HTMLDivElement;

    // Remove any existing canvases
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Create a chart for each category
    Object.keys(data).forEach(categoryName => {
      const categoryData = data[categoryName];
      const products = categoryData.products || {};

      // Create a new canvas element for each category
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Object.keys(products),
            datasets: [
              {
                label: label,
                data: Object.values(products).map(product => product[dataKey] || 0),
                backgroundColor: (context) => {
                  const chart = context.chart;
                  const { ctx } = chart;
                  const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
                  gradient.addColorStop(0, 'rgba(75, 192, 192, 0.5)');
                  gradient.addColorStop(1, 'rgba(75, 192, 192, 0.2)');
                  return gradient;
                },
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                barThickness: 30, // Adjust thickness for appearance
                borderRadius: 5,  // Rounded corners for appearance
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(tooltipItem: TooltipItem<'bar'>) {
                    const value = tooltipItem.raw as number;
                    const total = Object.values(products).reduce((sum, product) => sum + (product[dataKey] || 0), 0);
                    const percentage = (value / total) * 100;
                    return `${tooltipItem.label}: ${value} (${percentage.toFixed(2)}%)`;
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  autoSkip: false,
                  maxRotation: 90,
                  minRotation: 45,
                  callback: function(value) {
                    return value as string;
                  }
                },
                grid: {
                  display: false // Hide grid lines if needed
                },
                // Prevent axis from starting at zero
                beginAtZero: false,
                suggestedMin: Math.min(...Object.values(products).map(product => product[dataKey] || 0)) * 0.9 // Adjust to ensure all bars are visible
              },
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    });
  }


  createPieChart(chartId: string, label: string, data: { [key: string]: ProductData }): void {
    const ctx = (document.getElementById(chartId) as HTMLCanvasElement).getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut', // Use 'doughnut' for a 3D-like effect
        data: {
          labels: Object.keys(data),
          datasets: [{
            label: label,
            data: Object.values(data).map(category => category.total_visits || 0),
            backgroundColor: [
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)',
              // Add more colors as needed
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              // Add more colors as needed
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function(tooltipItem: TooltipItem<'doughnut'>) {
                  const value = tooltipItem.raw as number;
                  const total = Object.values(data).reduce((sum, item) => sum + (item.total_visits || 0), 0);
                  const percentage = (value / total) * 100;
                  return `${tooltipItem.label}: ${value} (${percentage.toFixed(2)}%)`;
                }
              }
            }
          }
        }
      });
    }
  }
}
