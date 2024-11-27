import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private hasSessionExpiredAlertShown = false; // Flag to ensure the session expired alert is only shown once
  private hasTriedRefreshing = false; // Track if we've already tried to refresh the token once

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentUser = this.authService.currentUserValue;

    // If no user is logged in, proceed without adding the token
    if (!currentUser) {
      return next.handle(request);
    }

    if (currentUser.access_token && !this.isExemptedUrl(request.url)) {
      request = this.addToken(request, currentUser.access_token); // Add token to the request
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && currentUser) {
          // Handle 401 Unauthorized errors
          return this.handle401Error(request, next, currentUser);
        } else {
          return throwError(error);
        }
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler, currentUser: any): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Vider les informations de l'utilisateur avant d'essayer de rafraîchir le token
      this.authService.clearCurrentUser(); // Assurez-vous que cette méthode efface les données nécessaires

      // Attempt to refresh the token
      return this.authService.refreshToken(currentUser.user.username).pipe(
        switchMap((response: any) => {
          if (response.status === 'success' && response.message) {
            const newAccessToken = response.message;
            this.isRefreshing = false;
            this.refreshTokenSubject.next(newAccessToken);
            this.authService.setCurrentUserToken(newAccessToken); // Save new access token
            this.hasTriedRefreshing = false; // Reset the flag on successful refresh
            return next.handle(this.addToken(request, newAccessToken)); // Retry the original request with the new token
          } else {
            this.isRefreshing = false;
            this.handleRefreshTokenFailure();
            return throwError(() => new Error('Invalid refresh token response.'));
          }
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.handleRefreshTokenFailure();
          return throwError(() => new Error('Token refresh failed.'));
        })
      );
    } else if (this.hasTriedRefreshing) {
      // If we've already tried refreshing, then log out the user
      this.handleRefreshTokenFailure();
      return throwError(() => new Error('Token has already been refreshed and failed again.'));
    } else {
      // If a token refresh is already in progress, queue subsequent requests
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token)))
      );
    }
  }

  private handleRefreshTokenFailure(): void {
    if (!this.hasSessionExpiredAlertShown) {
      this.hasSessionExpiredAlertShown = true; // Ensure alert is shown only once
      this.showSessionExpiredAlert();
    }
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Check if the URL is exempted from token addition (e.g., login, register, refresh-token)
  private isExemptedUrl(url: string): boolean {
    return url.includes('/refresh-token') || url.includes('/login') || url.includes('/register');
  }

  private showSessionExpiredAlert(): void {
    Swal.fire({
      icon: 'error',
      title: 'Session Expirée',
      text: 'Votre session a expiré. Veuillez vous reconnecter.',
      confirmButtonText: 'OK'
    }).then(() => {
      this.authService.logout(); // Clear session and cookies
      this.hasSessionExpiredAlertShown = false;  // Reset the flag after logout and alert
      this.hasTriedRefreshing = false; // Reset the flag for the next session
      this.router.navigate(['/login']);  // Navigate to the login page
    });
  }
}
