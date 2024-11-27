import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ApiResponse } from 'src/app/auth/Model/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileClientService {

  private baseUrl = `http://localhost:8070/auth-s/api/auth`;

  constructor(private http: HttpClient) { }


  getuser(userId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/find/id/${userId}/`);
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
  }}
