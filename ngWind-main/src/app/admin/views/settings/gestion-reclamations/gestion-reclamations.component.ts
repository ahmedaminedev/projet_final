import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GestionReclamationsService } from './gestion-reclamations.service';
import { AdminService } from 'src/app/admin/admin.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-gestion-reclamations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-reclamations.component.html',
  styleUrls: ['./gestion-reclamations.component.css']
})
export class GestionReclamationsComponent implements OnInit {
  totalReclamations: number = 0;
  pendingReclamations: number = 0;
  resolvedReclamations: number = 0;
  rejectedReclamations: number = 0;
  reclamations: any[] = [];
  selectedReclamation: any = null;
  scrapers: any[] = [];
  reclamationToAssign: any = null;
  menuOpen: any = null;
  imageModalOpen = false;
  currentImage: string = '';
  currentUser = this.authService.currentUserValue;
  userRole: string | null = null;

  private imageSubject = new BehaviorSubject<SafeUrl | null>(null);
  image$ = this.imageSubject.asObservable();

  constructor(private reclamationsService: GestionReclamationsService,
              private adminService: AdminService,
              private sanitizer: DomSanitizer,
              private authService: AuthService,
            ) { }

// Composant GestionReclamationsComponent
ngOnInit(): void {
  this.loadReclamations();
  this.loadScrapers();
  this.currentUser = this.authService.currentUserValue;
  this.userRole = this.currentUser.user.role;
  console.log(this.userRole)
  console.log(this.currentUser.user.id)

}

loadReclamations() {
  console.log('User Role:', this.authService.currentUserValue.user.role);
  console.log('Current User ID:', this.currentUser.user.id);

  // Si l'utilisateur a le rôle SCRAPPER
  if (this.authService.currentUserValue.user.role === 'SCRAPPER') {
    console.log('Fetching reclamations for scraper...');
    // Charger uniquement les réclamations assignées à ce scraper
    this.reclamationsService.getReclamationsByScraper(this.currentUser.user.id).subscribe(data => {
      console.log('Data fetched for scraper:', data);
      this.reclamations = data;
      this.totalReclamations = data.length;
    }, error => {
      console.error('Error fetching reclamations for scraper:', error);
    });
  } else {
    console.log('Fetching all reclamations...');
    // Sinon, charger toutes les réclamations
    this.reclamationsService.getAllReclamations().subscribe(data => {
      console.log('Data fetched for all reclamations:', data);
      this.reclamations = data;
      this.totalReclamations = data.length;
    }, error => {
      console.error('Error fetching all reclamations:', error);
    });
  }
}


  loadScrapers() {
    this.adminService.getScrappers().subscribe(scrapers => {
      scrapers.forEach(scraper => {
        if (scraper.username) {
          this.reclamationsService.getpageparusernamescraper(scraper.username).subscribe(pages => {
            scraper.pages = pages;
          });
        }
      });
      this.scrapers = scrapers;
    });
  }

  getImagePath(imageName: string): Observable<SafeUrl> {
    if (imageName.startsWith('/')) {
      imageName = imageName.substring(1); // Remove leading slash if present
    }
    return this.reclamationsService.getImage(imageName).pipe(
      map(blob => {
        const objectURL = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectURL);
      }),
      catchError(error => {
        console.error('Error loading image', error);
        return of(this.sanitizer.bypassSecurityTrustUrl('assets/images/placeholder.png')); // Provide a fallback image
      })
    );
  }

  viewDetails(reclamation: any) {
    this.selectedReclamation = reclamation;
    this.getImagePath(reclamation.capture).subscribe(url => {
      this.imageSubject.next(url);
    });
  }

  closeModal() {
    this.selectedReclamation = null;
    this.imageSubject.next(null);
  }

  openAssignScraperModal(reclamation: any) {
    this.reclamationToAssign = reclamation;
    this.loadScrapers();
  }

  closeAssignScraperModal() {
    this.reclamationToAssign = null;
  }

  assignScraper(reclamationId: number, scraperId: number) {
    this.reclamationsService.assignScraper(reclamationId, scraperId).subscribe(() => {
      this.loadReclamations();
      this.closeAssignScraperModal();
    });
  }

  validateReclamation(reclamation: any) {
    reclamation.etat = 'TRAITEE';
    this.reclamationsService.updateReclamation(reclamation.id, reclamation).subscribe(() => {
      this.loadReclamations();
    });
  }

  deleteReclamation(reclamationId: number) {
    this.reclamationsService.deleteReclamation(reclamationId).subscribe(() => {
      this.loadReclamations();
    });
  }

  getEtatClass(etat: string): string {
    switch (etat) {
      case 'EN_COURS':
        return 'bg-yellow-200 text-yellow-700';
      case 'TRAITEE':
        return 'bg-green-200 text-green-700';
      case 'REFUSEE':
        return 'bg-red-200 text-red-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  }

  toggleActionsMenu(reclamation: any) {
    this.menuOpen = this.menuOpen === reclamation ? null : reclamation;
  }

  isMenuOpen(reclamation: any): boolean {
    return this.menuOpen === reclamation;
  }

  openImageModal(imageUrl: string) {
    this.currentImage = imageUrl;
    this.imageModalOpen = true;
  }

  closeImageModal() {
    this.imageModalOpen = false;
  }

  isRole(role: string): boolean {
    return this.userRole === role;
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.userRole !== null;
  }
}
