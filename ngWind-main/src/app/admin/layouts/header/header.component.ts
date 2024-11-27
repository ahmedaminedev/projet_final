import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { HeaderService } from 'src/app/public/layouts/header/header.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit{
  isOpen: boolean = false;
  user: any = {}; // Stocker les détails de l'utilisateur connecté
  notificationsCount: number = 0;
  notifications: any[] = [];
  userRole: string | null = null;
  notificationsVisible = false;
  currentUser = this.authService.currentUserValue;





  constructor(
    private element: ElementRef,
    private renderer: Renderer2,
    private authService: AuthService,
    private router: Router,
    private headerService: HeaderService,
  ) {
    this.getUserDetails(); // Récupérer les détails de l'utilisateur au chargement
  }
  ngOnInit(): void {
    this.loadNotifications();
    this.userRole = this.currentUser.user.role;
  }
  onClickProfile = () => {
    const profileDropdownList = this.element.nativeElement.querySelector('.profile-dropdown-list');
    const isExpanded = profileDropdownList.getAttribute('aria-expanded') === 'true';

    // Bascule de l'état du menu déroulant
    if (isExpanded) {
      this.renderer.setAttribute(profileDropdownList, 'aria-expanded', 'false');
      this.renderer.removeClass(profileDropdownList, 'visible'); // Masque la liste
    } else {
      this.renderer.setAttribute(profileDropdownList, 'aria-expanded', 'true');
      this.renderer.addClass(profileDropdownList, 'visible'); // Affiche la liste
    }
  };

  // Charger les notifications depuis le service
  loadNotifications(): void {
    const userId = this.authService.currentUserValue?.user.id;
    this.headerService.getUserNotifications(userId).subscribe(
      (data) => {
        this.notificationsCount = data.count;
        this.notifications = data.notifications.map((notification: any) => ({
          ...notification,
          avatar: 'assets/avatar-default.png', // Exemple d'avatar par défaut
        }));
      },
      (error) => {
        console.error('Erreur lors de la récupération des notifications', error);
      }
    );
  }
  isLoggedIn(): boolean {
    return this.userRole !== null;
  }
  logout(): void {
    this.authService.logout();
    this.userRole = null;
    Swal.fire({
      icon: 'success',
      title: 'Déconnexion réussie',
      text: 'Vous avez été déconnecté avec succès.',
      confirmButtonText: 'OK'
    }).then(() => {
      this.router.navigate(['/login']);
    });
  }

  // Basculer la boîte de notifications
  toggleNotifications(): void {
    this.notificationsVisible = !this.notificationsVisible;
  }

  getUserDetails(): void {
    this.user = this.authService.currentUserValue.user // Récupérer les détails de l'utilisateur
    console.log(this.user); // Afficher l'ID de l'utilisateur pour vérification
  }
    // Vérifier le rôle de l'utilisateur
    isRole(role: string): boolean {
      return this.userRole === role;
    }

}
