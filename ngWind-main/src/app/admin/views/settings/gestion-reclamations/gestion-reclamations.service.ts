import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestionReclamationsService {

  private apiUrl = `http://localhost:8070/reclamations/api`;  // Base URL de votre API backend

  constructor(private http: HttpClient) { }

  // Méthode pour obtenir toutes les réclamations
  getAllReclamations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  // Méthode pour obtenir une réclamation par ID
  getReclamationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Méthode pour créer une nouvelle réclamation
  createReclamation(reclamation: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, reclamation);
  }

  // Méthode pour télécharger une image
  uploadImage(image: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', image);

    return this.http.post<string>(`${this.apiUrl}/upload`, formData, { responseType: 'text' as 'json' });
  }

  getImage(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/assets/images/upload/${filename}`, { responseType: 'blob' });
  }
  getReclamationsByScraper(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/scrapper/${userId}`);
  }
  // Méthode pour mettre à jour une réclamation existante
  updateReclamation(id: number, reclamation: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put(`${this.apiUrl}/${id}`, reclamation, { headers });
  }

  // Méthode pour supprimer une réclamation
  deleteReclamation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Méthode pour obtenir un utilisateur par son username
  getUserByUsername(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${username}`);
  }

  // Méthode pour assigner un scraper à une réclamation
  assignScraper(reclamationId: number, scraperId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${reclamationId}/assign-scraper/${scraperId}`, {});
  }

  // Méthode pour obtenir les réclamations affectées
  getReclamationsAffectees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/affectees`);
  }

  // Méthode pour obtenir les réclamations non affectées
  getReclamationsNonAffectees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/non-affectees`);
  }

  // Méthode pour obtenir les réclamations par userId
  getReclamationsByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fournisseur/${userId}`);
  }


  getpageparusernamescraper(username_scraper: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8070/scraping/pages/scraper/${username_scraper}/`);
  }


}
