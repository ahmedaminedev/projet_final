import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private apiUrl = 'http://localhost:8070/scraping'; // Ajustez l'URL selon vos besoins

  constructor(private http: HttpClient) {}

  getProductsByCategory(categoryId: number): Observable<{ products: any[] }> {
    return this.http.get<{ products: any[] }>(`${this.apiUrl}/getprod/categorie/${categoryId}/`).pipe(
      catchError(this.handleError)
    );
  }


  getFilteredAttributesByCategory(categoryId: number): Observable<any> {
    const url = `${this.apiUrl}/filter/categorie/${categoryId}/`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour obtenir la plage de prix par catégorie
  getPriceRangeByCategory(categoryId: number): Observable<{ min_price: number, max_price: number }> {
    const url = `${this.apiUrl}/range/min/max/categorie/${categoryId}/`;
    return this.http.get<{ min_price: number, max_price: number }>(url).pipe(
      catchError(this.handleError)
    );
  }



  // Méthode pour rechercher des produits filtrés par catégorie
  searchProductsByCategory(categoryId: number, filters: any): Observable<{ products: any[] }> {
    let params = new HttpParams();
console.log("filter dans service",filters.refs_cartes_graphiques)
    // Ajouter les filtres aux paramètres
    if (filters.processeurs) {
      filters.processeurs.forEach((processeur: string) => {
        params = params.append('processeur', processeur);
      });
    }
    if (filters.memoires) {
      filters.memoires.forEach((memoire: string) => {
        params = params.append('memoire', memoire);
      });
    }
    if (filters.disques) {
      filters.disques.forEach((disqueDur: string) => {
        params = params.append('disque-dur', disqueDur);
      });
    }
    if (filters.cartes_graphiques) {
      filters.cartes_graphiques.forEach((carteGraphique: string) => {
        params = params.append('carte-graphique', carteGraphique);
      });
    }
    if (filters.refs_cartes_graphiques) {
      filters.refs_cartes_graphiques.forEach((refCarteGraphique: string) => {
        params = params.append('ref-carte-graphique', refCarteGraphique);
      });
    }


    if (filters.gamer) {
      filters.gamer.forEach((gamer: string) => {
        params = params.append('gamer', gamer);
      });
    }
    if (filters.prixMin) {
      params = params.append('prix-min', filters.prixMin);
    }
    if (filters.prixMax) {
      params = params.append('prix-max', filters.prixMax);
    }

    // Faire l'appel HTTP avec les filtres
    return this.http.get<{ products: any[] }>(`${this.apiUrl}/listes/categorie/${categoryId}/test/`, { params }).pipe(
      catchError(this.handleError)
    );
  }




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
