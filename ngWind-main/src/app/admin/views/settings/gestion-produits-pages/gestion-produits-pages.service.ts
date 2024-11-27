import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestionProduitsPagesService {

  private apiUrl = 'http://localhost:8070/scraping'; // Mettez à jour l'URL API

  constructor(private http: HttpClient) {}


  get_products_page(pageId: number): Observable<any> {
    return this.http.get<void>(`${this.apiUrl}/getproduct/Admins/${pageId}/`).pipe(
      catchError(this.handleError)
    );
  }

  deleteAllProductFromPage(pageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/product/delete_all_products_by_page/${pageId}/`).pipe(
      catchError(this.handleError)
    );
  }

  deleteProductById(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/product/delete_product_by_Id/${productId}/`).pipe(
      catchError(this.handleError)
    );
  }


  // Méthode pour mettre à jour un produit
  updateProduct(productId: number, productData: any): Observable<any> {
    const url = `${this.apiUrl}/product/update/${productId}/`;

    // Définir les en-têtes si nécessaire (par exemple, pour les données JSON)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(url, JSON.stringify(productData), { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur côté client : ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error.error || 'Requête invalide (400).';
          break;
        case 404:
          errorMessage = error.error.error || 'Ressource non trouvée (404).';
          break;
        case 500:
          errorMessage = error.error.error || 'Erreur interne du serveur (500).';
          break;
        default:
          errorMessage = `Code d'erreur inattendu : ${error.status}`;
      }
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
