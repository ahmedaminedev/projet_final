import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { User } from '../auth/Model/User.model';
import { ApiResponse } from '../auth/Model/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = `http://localhost:8070/auth-s/api/auth`;

  constructor(private http: HttpClient) { }
  getScrappers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/find/Scrapers/`);
  }


  getSuppliers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/Fournisseur/find/`);
  }
  getSuppliersConfimrmed(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/Fournisseur/find/confirmed`);
  }
  addUser(user: any): Observable<ApiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse>(`${this.baseUrl}/adduser`, user, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(username: string, editProfileDTO: any): Observable<ApiResponse> {
    console.log("=======",editProfileDTO)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put<ApiResponse>(`${this.baseUrl}/updateuser/${username}`, editProfileDTO, { headers }).pipe(
      catchError(this.handleError)
    );
  }


  deleteUser(userId: number, username: string): Observable<string> {
    return this.http.delete(`${this.baseUrl}/deleteuser/${userId}/${username}/`, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }


  updateUserConfirmationState(username: string): Observable<string> {
    return this.http.put(`${this.baseUrl}/update_fournisseur/${username}/confirmation-state`, {}, { responseType: 'text' });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Unknown error!';
console.log("444444",error)
    if (error.error instanceof ErrorEvent) {
      errorMessage = `${error.error.message}`;
    } else {
      errorMessage = `${error.error.message}`;
    }

    console.error("ttt",errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
