import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Categorie } from 'src/app/auth/Model/categorie.model';

@Injectable({
  providedIn: 'root'
})
export class CatgoriepageService {
  private apiUrl = 'http://localhost:8070/scraping/api/categories'; // Ajustez l'URL selon vos besoins

  constructor(private http: HttpClient) {}


  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/`).pipe(
      catchError(this.handleError)
    );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    console.log(error)
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


  addCategory(category: Categorie): Observable<Categorie> {
    return this.http.post<Categorie>(`${this.apiUrl}/create/`, category, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      catchError(this.handleError)  // Appel de la méthode handleError en cas d'erreur
    );
  }





}





