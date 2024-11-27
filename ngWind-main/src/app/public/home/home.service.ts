import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  private apiUrl = 'http://localhost:8070/scraping/api'; // Ajustez l'URL si nécessaire

  constructor(private http: HttpClient) {}

  // Méthode pour récupérer le top 8 des produits ajoutés aux favoris
  getTop8Favorites(): Observable<any> {
    const url = `${this.apiUrl}/get_top_8_favorites/`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }


    // Méthode pour récupérer les categories pere avec nbr de produits
    getcountcategorie_produits(): Observable<any> {
      const url = `http://localhost:8070/scraping/product/categories/completed/count/`;
      return this.http.get<any>(url).pipe(
        catchError(this.handleError)
      );
    }
  // Méthode pour récupérer le top 8 des produits les plus visités
  getTop8Visited(): Observable<any> {
    const url = `${this.apiUrl}/get_top_8_visited/`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  // Gestion des erreurs HTTP
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    console.log(error);
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = error.error.error || 'Invalid request (400).';
          break;
        case 404:
          errorMessage = 'Resource not found (404).';
          break;
        case 500:
          errorMessage = 'Internal server error (500).';
          break;
        default:
          errorMessage = `Unexpected error code: ${error.status}`;
      }
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
