import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MagicSearchService {

  private apiUrl = 'http://localhost:8070/scraping/product/link/details_and_similar_by_link/'; // URL de votre API

  constructor(private http: HttpClient) {}

  // Méthode pour récupérer les détails d'un produit et les produits similaires
  getProductDetailsAndSimilarbylink(link: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      product_link: link
    };

    return this.http.post(this.apiUrl, body, { headers });
  }

}
