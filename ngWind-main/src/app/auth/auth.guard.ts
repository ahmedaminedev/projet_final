import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.isAuthenticated().pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          const expectedRole = route.data['role'];
          if (expectedRole && expectedRole.indexOf(this.authService.currentUserValue.user?.role) === -1) {
            this.router.navigate(['/login']);
            return false;
          }
          return true;
        }

        this.router.navigate(['/login']);
        return false;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
