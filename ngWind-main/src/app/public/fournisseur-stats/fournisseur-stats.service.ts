import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FournisseurStatsService {

  private apiBase = 'http://localhost:8070/scraping'; // Adjust as needed

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

  getTop15FavoritesByCategoryBySite(site_name: string): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/top-favorites/${site_name}/`).pipe(
      catchError(this.handleError)
    );
  }

  getTop15BaiseByCategoryBySite(site_name: string): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/top-15-baises-by-category/${site_name}/`).pipe(
      catchError(this.handleError)
    );
  }

  getTop15VisiteurByCategoryBySite(site_name: string): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/top-visits/${site_name}/`).pipe(
      catchError(this.handleError)
    );
  }

}
