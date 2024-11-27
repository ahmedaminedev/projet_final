import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Page } from 'src/app/auth/Model/Page.model';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  private apiUrl = 'http://localhost:8070/scraping'; // Mettez à jour l'URL API

  constructor(private http: HttpClient) {}

  getPages(): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.apiUrl}/api/pages`);
  }

  deletePage(pageid: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete-page/${pageid}/`).pipe(
      catchError(this.handleError)
    );
  }

  deleteallproductsandpages(username: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/page/${username}`).pipe(
      catchError(this.handleError)
    );
  }

  get_count_product_page(pageId: number): Observable<any> {
    return this.http.get<void>(`${this.apiUrl}/count/product/page/${pageId}/`).pipe(
      catchError(this.handleError)
    );
  }


  updatePage(pageId: number, pageData: Partial<Page>): Observable<Page> {
    const url = `${this.apiUrl}/api/pages/edit/${pageId}/`;
    return this.http.put<Page>(url, pageData, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Nouvelle méthode pour mettre à jour l'état du service à "TERMINER"
  updateServiceStateToCompleted(pageId: number): Observable<any> {
    const url = `${this.apiUrl}/update/terminer/service/page/${pageId}/`;
    return this.http.put(url, {}).pipe(
      catchError(this.handleError)
    );
  }

  // Nouvelle méthode pour mettre à jour l'état du service à "EN_ATTENTE"
  updateServiceStateToEnAttente(pageId: number): Observable<any> {
    const url = `${this.apiUrl}/update/attente/service/page/${pageId}/`;
    return this.http.put(url, {}).pipe(
      catchError(this.handleError)
    );
  }
  assignerPage(userId: number, categoryId: number, pageData: Page): Observable<Page> {
    const url = `${this.apiUrl}/creer_page/fournisseur/${userId}/category/${categoryId}/`;

    return this.http.post<Page>(url, pageData, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) })
      .pipe(
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
        case 403:
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
