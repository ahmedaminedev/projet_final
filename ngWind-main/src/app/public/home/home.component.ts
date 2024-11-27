import { Component, OnInit } from '@angular/core';
import { HomeService } from './home.service';  // Assurez-vous que le chemin du service est correct
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { FavoriteService } from '../favorite/favorite.service';
import { HeaderService } from '../layouts/header/header.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [NgClass,NgFor,NgIf,RouterModule,CommonModule],
  standalone: true
})
export class HomeComponent implements OnInit {
  topFavorites: any[] = [];
  topVisited: any[] = [];
  errorMessage: string = '';
  categories_peres: any[] = [];
  currentUser = this.authService.currentUserValue;
  userRole: string | null = null;
  error: any;

  constructor(private router: Router,private authService: AuthService,private homeService: HomeService,private headerService: HeaderService,private favoriteService: FavoriteService,) {}
  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    // Check if currentUser is defined before accessing its properties
    if (this.currentUser) {
      this.userRole = this.currentUser.user.role;
    } else {
      this.userRole = null; // or assign a default value if needed
    }

    // Load top favorites, top visited, and categories regardless of user connection
    this.loadTopFavorites();
    console.log(this.topFavorites);

    this.loadTopVisited();
    console.log(this.loadTopVisited());

    this.load_categories_peres();
    console.log(this.load_categories_peres());
  }



  addToFavorites(productId: number): void {
    if (!this.isLoggedIn()) {
      Swal.fire({
        title: 'Attention',
        text: 'Vous devez vous connecter pour accéder aux catégories.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
    } else {
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
  }



  navigateTo(productId: number): void {
    if (!this.isLoggedIn()) {
      Swal.fire({
        title: 'Attention',
        text: 'Vous devez vous connecter pour accéder aux catégories.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
    } else {
    this.router.navigate(['/products/details', productId]);
    }
  }


  load_categories_peres(): void {
    this.homeService.getcountcategorie_produits().subscribe(
      (response: any) => {
        console.log(response);
        this.categories_peres=response
      },
      error => {
        console.error('Erreur lors de la récupération des categories:', error);
      }
    );
  }
  loadTopFavorites(): void {
    this.homeService.getTop8Favorites().subscribe(
      (data) => {
        console.log(data); // Ajoutez ceci pour déboguer
        this.topFavorites = data;
      },
      (error) => {
        this.error = error;
        console.error(error);
      }
    );
  }


  loadTopVisited(): void {
    this.homeService.getTop8Visited().subscribe(
      (response: any) => {
        console.log(response);
        this.topVisited=response
      },
      error => {
        console.error('Erreur lors de la récupération des visite:', error);
      }
    );
  }



  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.userRole !== null;
  }
  // Vérifier le rôle de l'utilisateur
  isRole(role: string): boolean {
    return this.userRole === role;
  }


  }


