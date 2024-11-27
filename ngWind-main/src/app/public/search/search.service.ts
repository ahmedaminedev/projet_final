import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = 'http://localhost:8070/scraping';

  constructor(private http: HttpClient) {}



  searchAndGroupDetails(searchString: string): Observable<any> {
    const params = new HttpParams().set('search_string', searchString);
    return this.http.get<any>(`${this.apiUrl}/getproduct/search/`, { params })
      .pipe(catchError(this.handleError));
  }





    // Méthode pour filtrer les produits
    filterProducts(filters: any): Observable<any> {
      let params = new HttpParams();

      // Ajouter les filtres aux paramètres de la requête
      for (const key in filters) {
        if (filters.hasOwnProperty(key)) {
          params = params.append(key, filters[key]);
        }
      }

      return this.http.get<any>(`${this.apiUrl}/getproduct/filter/`, { params })
        .pipe(catchError(this.handleError));
    }

  private handleError(error: any) {
    let errorMessage = 'An unknown error occurred!';
    console.error("eeeeererrr",error.error.error);
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.error}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error.error || 'Invalid request (400).';
          break;
        case 404:
          errorMessage =error.error.error|| 'Resource not found (404).';
          break;
        case 500:
          errorMessage = 'Internal server error (500).';
          break;
        default:
          errorMessage = `Unexpected error code: ${error.status}`;
      }
    }
    return throwError(errorMessage);
  }
}
