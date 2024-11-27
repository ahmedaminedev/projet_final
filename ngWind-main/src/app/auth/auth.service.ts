import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';
import { ApiResponse } from './Model/api-response.model';
import { User } from './Model/User.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private loginDetails: { username: string; password: string } | null = null;

  private readonly loginUrl = 'http://localhost:8070/auth-s/api/auth/login';
  private readonly registerUrl = 'http://localhost:8070/auth-s/api/auth/register';
  private readonly checkLoginUrl = 'http://localhost:8070/auth-s/api/auth/check-login';
  private readonly logoutUrl = 'http://localhost:8070/auth-s/api/auth/logout';
  private readonly refreshTokenUrl = 'http://localhost:8070/auth-s/api/auth/refresh-token';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) {
    const storedUser = this.cookieService.get('currentUser');
    console.log('Stored user from cookie:', storedUser);
    this.currentUserSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Unknown error!';
    console.log("errrr",error);
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `${error.error.message}`;
    }

    console.error('Error occurred:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  login(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Attempting to login with username:', username);
    return this.http.post<any>(this.loginUrl, { username, password }, { headers }).pipe(
      map(response => {
        console.log('Login response:', response);
        const user = response;

        if (!user) {
          throw new Error('No user data found in response');
        }

        this.cookieService.set('currentUser', JSON.stringify(user), { secure: true, sameSite: 'Strict', path: '/' });
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(error => {
        console.log("login errrr",error)
        const errorMessage = error.status === 401
          ? error.error.errorMessage || 'Une erreur s\'est produite lors de la connexion.'
          : 'Une erreur s\'est produite lors de la connexion.';
        console.error('Login error:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  register(user: any): Observable<ApiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Attempting to register user:', user);

    return this.http.post<ApiResponse>(this.registerUrl, user, { headers }).pipe(
      tap((response: any) => console.log('Backend response:', response)), // Log the response from the backend
      catchError(this.handleError)
    );
}





  checkLogin(): Observable<User> {
    console.log('Checking login status');
    return this.http.get<User>(this.checkLoginUrl).pipe(
      catchError(this.handleError)
    );
  }



logout(): void {
    console.log('Logging out');
    this.http.post(this.logoutUrl, {}, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Logout response:', response);
      },
      error: (err) => {
        console.error('Logout error:', err);
      },
      complete: () => {
        // Delete the cookie
        this.cookieService.delete('currentUser', '/');

        // Ensure the cookie is deleted (you can also check in the browser dev tools)
        console.log('Cookie after deletion:', this.cookieService.get('currentUser'));

        // Update the currentUserSubject to notify observers
        this.currentUserSubject.next(null);

        // Redirect to login
        this.router.navigate(['/login']);
      }
    });
}




  isAuthenticated(): Observable<boolean> {
    if (!this.currentUserValue || !this.currentUserValue.access_token) {
      return of(false);
    }

    return this.checkLogin().pipe(
      map(response => {
        const isAuthenticated = !!response.id;
        if (!isAuthenticated) {
          Swal.fire({
            icon: 'warning',
            title: 'Session Expirée',
            text: 'Votre session a expiré, veuillez vous reconnecter.',
            confirmButtonText: 'OK'
          }).then(() => {
            this.logout();
          });
        }
        return isAuthenticated;
      }),
      catchError(err => {
        console.error('Error during authentication check:', err);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  getRole(): string {
    return this.currentUserValue?.role || '';
  }


  setLoginDetails(username: string, password: string): void {
    this.loginDetails = { username, password };
  }

  getLoginDetails(): { username: string; password: string } | null {
    return this.loginDetails;
  }

  clearLoginDetails(): void {
    this.loginDetails = null;
  }

  setCurrentUserToken(token: string): void {
    const currentUser = this.currentUserValue;
    if (currentUser) {
      currentUser.access_token = token;
      this.cookieService.set('currentUser', JSON.stringify(currentUser), { secure: true, sameSite: 'Strict' });
      this.currentUserSubject.next(currentUser);
    }
  }

  refreshToken(username: string): Observable<any> {
    console.log('Attempting to refresh token for:', username);

    return this.http.post<any>('http://localhost:8070/auth-s/api/auth/refresh-token', null, {
        params: { username }
    }).pipe(
        map(response => {
            console.log('Refresh token response:', response);
            if (response.status === 'success') {
                this.setCurrentUserToken(response.message);
                console.log('New access token set:', response.message);
            } else {
                console.error('Failed to refresh token:', response.message);
            }
            return response;
        }),
        catchError(error => {
            console.error('Error refreshing token:', error);
            return throwError(() => new Error('Failed to refresh token'));
        })
    );
}


clearCurrentUser(): void {
  // Effacer le cookie
  this.cookieService.delete('currentUser', '/');

  // Réinitialiser le BehaviorSubject
  this.currentUserSubject.next(null);

  // Optionnel : rediriger vers la page de connexion ou effectuer d'autres actions
}




}
