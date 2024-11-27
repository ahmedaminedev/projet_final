import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class ScrapingService {
  private socket: Socket;

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:5000'); // URL du serveur Flask

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    this.socket.on('progress', (data: { pageId: number, progress: number }) => {
      console.log('Progress data received:', data);
    });
  }


  private progressObservers: { [pageId: number]: () => void } = {};



// Nouvelle méthode pour mettre à jour l'état du service à "TERMINER"
startScraping(pageId: number): Observable<any> {
  const url = `http://localhost:8070/scraping/scrape_page/${pageId}/`;
  return this.http.post(url, {}).pipe(
    catchError(this.handleError)
  );
}


getRunningJobs(): Observable<any> {
  const url = 'http://localhost:8070/scraping/get_running_jobs/service/page/';
  return this.http.get(url).pipe(
    catchError(this.handleError)
  );
}


addConfigurationSchedule(jobData: any): Observable<any> {
  const url = `http://localhost:8070/scraping/add-configuration/`;
console.log(jobData)
  return this.http.post<any>(url, jobData, {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }).pipe(
    catchError(this.handleError)
  );
}



deletejob(id: number): Observable<any> {
  return this.http.delete<any>(`http://localhost:8070/scraping/delete-configuration/${id}/`).pipe(
    catchError(this.handleError)
  );
}


cancelScraping(pageId: number): Observable<any> {
  const url = `http://localhost:8070/scraping/cancel-scraping/${pageId}/`;
  return this.http.post<any>(url, {}).pipe(
    catchError(this.handleError)
  );
}





  onProgressUpdate(pageId: number): Observable<number> {
    return new Observable<number>(observer => {
      const handler = (data: { page_id: number, progress: number }) => {
        if (data.page_id === pageId) {
          observer.next(data.progress);
        }
      };

      this.socket.on('progress', handler);

      // Save the unsubscription handler to be able to unsubscribe later
      this.progressObservers[pageId] = () => {
        this.socket.off('progress', handler);
      };

      // Handle cleanup on observable unsubscription
      return () => {
        if (this.progressObservers[pageId]) {
          this.progressObservers[pageId]();
          delete this.progressObservers[pageId];
        }
      };
    });
  }



  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    console.log("eeeeeeeeeeee",error)
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur côté client : ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
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
