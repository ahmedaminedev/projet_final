import { Component, OnInit } from '@angular/core';
import { FavoriteService } from './favorite.service'; // Assurez-vous que le chemin est correct
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/auth/auth.service';
import { HeaderService } from '../layouts/header/header.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class FavoriteComponent implements OnInit {
  favorites: any[] = []; // Pour stocker la liste des produits favoris
  totalItems: number = 0;
  totalPrice: number = 0;
  userId: number = 0; // Assurez-vous que cet ID est bien défini

  constructor(private favoriteService: FavoriteService, private authService: AuthService,private headerService: HeaderService,
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.currentUserValue.user?.id;
    if (this.userId) {
      this.loadFavorites(); // Utilisez userId pour charger les favoris
    } else {
      console.error('User ID is not available');
    }
  }


  loadFavorites(): void {
    this.favoriteService.getFavorites(this.userId).subscribe(
      (response: any) => {
        console.log(response);
        this.favorites = response.favorites; // Accédez à 'favorites'
        this.totalItems = this.favorites.length;
        this.totalPrice = this.favorites.reduce((sum, product) => sum + product.prix, 0); // Assurez-vous que 'prix' est le bon attribut
      },
      error => {
        console.error('Erreur lors de la récupération des favoris:', error);
      }
    );
  }

  removeFromFavorites(productId: number): void {
    this.favoriteService.deleteFromFavorites(productId).subscribe(
      () => {
        this.loadFavorites(); // Recharger la liste après suppression
        this.headerService.updateFavoritesCount(); // Met à jour le compteur global

      },
      error => {
        console.error('Erreur lors de la suppression des favoris:', error);
      }
    );
  }



  clearAllFavorites(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will remove all items from your favorites!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete all!',
      cancelButtonText: 'No, keep them'
    }).then((result) => {
      if (result.isConfirmed) {
        this.favoriteService.deleteAllFavorites().subscribe(
          response => {
            console.log('All favorites cleared:', response);
            this.favorites = []; // Clear the local favorites list
            this.totalItems = 0;
            this.totalPrice = 0;
            this.headerService.updateFavoritesCount();
            Swal.fire('Deleted!', 'All your favorites have been deleted.', 'success');
          },
          error => {
            console.error('Error clearing all favorites:', error);
            Swal.fire('Error!', 'There was a problem deleting your favorites.', 'error');
          }
        );
      }
    });
  }

}
