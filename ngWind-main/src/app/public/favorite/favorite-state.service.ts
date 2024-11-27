// favorite-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteStateService {
  private favoritesCountSubject = new BehaviorSubject<number>(0);
  favoritesCount$ = this.favoritesCountSubject.asObservable();

  updateFavoritesCount(count: number): void {
    this.favoritesCountSubject.next(count);
  }
}
