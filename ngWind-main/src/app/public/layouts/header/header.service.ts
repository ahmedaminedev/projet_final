import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private apiUrl = 'http://localhost:8070/scraping'; // Ajustez l'URL selon vos besoins

  constructor(private http: HttpClient) {}

  private favoritesCountSubject = new BehaviorSubject<number>(0);
  favoritesCount$ = this.favoritesCountSubject.asObservable();

  private searchStringSubject = new BehaviorSubject<string>('');
  searchString$ = this.searchStringSubject.asObservable();

  setsearch(search: string): void {
    this.searchStringSubject.next(search);
    console.log(this.searchString$)
  }

  // Méthode pour mettre à jour le nombre de favoris
  updateFavoritesCount(): void {
    this.getFavoritesCount().subscribe((count) => {
      this.favoritesCountSubject.next(count.favorites_count);
    });
  }

  getFavoritesCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/favorites_count/`).pipe(
      catchError(this.handleError)
    );
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories/completed/`).pipe(
      catchError(this.handleError)
    );
  }

  getUserNotifications(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/notifications/${userId}/`).pipe(
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
