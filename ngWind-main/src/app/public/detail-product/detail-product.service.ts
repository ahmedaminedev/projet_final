import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DetailProductService {

  private apiUrl = 'http://localhost:8070/scraping'; // Ajustez l'URL si nécessaire

  constructor(private http: HttpClient) {}

  // Méthode pour récupérer les détails d'un produit et les produits similaires
  getProductDetailsAndSimilar(productId: number): Observable<any> {
    const url = `${this.apiUrl}/product/${productId}/details_and_similar/`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour récupérer l'historique des prix d'un produit
  getPriceHistory(productId: number): Observable<any> {
    const url = `${this.apiUrl}/product/${productId}/price-history/`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }
  // Méthode pour incrémenter le nombre de visiteurs
  incrementVisitors(productId: number): Observable<any> {
    const url = `${this.apiUrl}/increment_visitors/${productId}/`;
    return this.http.post<any>(url, {}).pipe(
      catchError(this.handleError)
    );
  }
  // Gestion des erreurs
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    console.log(error);
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur côté client : ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = error.error.error || 'Requête invalide (400).';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée (404).';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur (500).';
          break;
        default:
          errorMessage = `Code d'erreur inattendu : ${error.status}`;
      }
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
