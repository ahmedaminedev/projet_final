import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = 'http://localhost:8070/scraping'; // Ajustez l'URL si nécessaire

  constructor(private http: HttpClient) {}

  // Méthode pour récupérer les produits favoris
  getFavorites(userId: number): Observable<any> {
    const url = `${this.apiUrl}/user/${userId}/favorites/`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }
// Méthode pour supprimer tous les produits des favoris d'un utilisateur
deleteAllFavorites(): Observable<any> {
  const url = `${this.apiUrl}/favorites/delete_all/`;
  return this.http.post<any>(url, {}, {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }).pipe(
    catchError(this.handleError)
  );
}
  // Méthode pour ajouter un produit aux favoris
  addToFavorites(productId: number): Observable<any> {
    const url = `${this.apiUrl}/add_to_favorites/`;
    const body = { product_id: productId };
    return this.http.post<any>(url, body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour supprimer un produit des favoris
  deleteFromFavorites(productId: number): Observable<any> {
    const url = `${this.apiUrl}/delete_from_favorites/`;
    const body = { product_id: productId };
    return this.http.post<any>(url, body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    console.log(error);
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
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
