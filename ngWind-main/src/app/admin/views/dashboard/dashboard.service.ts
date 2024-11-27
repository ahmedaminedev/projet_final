import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiBase = 'http://localhost:8070/scraping/api'; // Adjust as needed

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    console.log(error);
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error.error || 'Bad Request (400).';
          break;
        case 404:
          errorMessage = 'Not Found (404).';
          break;
        case 500:
          errorMessage = 'Internal Server Error (500).';
          break;
        default:
          errorMessage = `Unexpected Error: ${error.status}`;
      }
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }

  getTop15FavoritesByCategory(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/top-15-favorites-by-category/`).pipe(
      catchError(this.handleError)
    );
  }

  getTop15BaiseByCategory(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/top_15_baise_by_category/`).pipe(
      catchError(this.handleError)
    );
  }

  getTop15VisiteurByCategory(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/top_15_visiteur_by_category/`).pipe(
      catchError(this.handleError)
    );
  }

  getTopVisitedCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/top_visited_categories/`).pipe(
      catchError(this.handleError)
    );
  }
}
