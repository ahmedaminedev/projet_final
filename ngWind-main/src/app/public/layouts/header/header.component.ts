import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Ajouté pour gérer les formulaires
import { AuthService } from 'src/app/auth/auth.service';
import { HeaderService } from './header.service';
import Swal from 'sweetalert2';
import { SearchService } from '../../search/search.service';

@Component({
  selector: 'public-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class PublicHeaderComponent implements OnInit {
  categoriesVisible = false;
  selectedCategory: any = null;
  profileMenuVisible = false;
  notificationsVisible = false;
  categories: any[] = [];
  userRole: string | null = null;
  notificationsCount: number = 0;
  notifications: any[] = [];
  favoritesCount: number = 0;
  searchString: string = '';

  constructor(
    private authService: AuthService,
    private headerService: HeaderService,
    private router: Router
  ) {}

  currentUser = this.authService.currentUserValue;

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    if (this.currentUser && this.currentUser.user) {
      this.userRole = this.currentUser.user.role;
      this.loadCategories();
      this.loadNotifications();

      this.headerService.favoritesCount$.subscribe((count) => {
        this.favoritesCount = count;
      });
      this.headerService.searchString$.subscribe((search) => {
        this.searchString = search;
      });

      this.headerService.updateFavoritesCount();
    } else {
      this.userRole = null; // Assigner null pour les utilisateurs non connectés
    }
    console.log("role1 : ",this.userRole)
    console.log("user : ",this.authService.currentUserValue)


  }

  onSearch(searchValue: string): void {
    this.searchString = searchValue;
    console.log(this.searchString);
    this.headerService.setsearch(this.searchString); // Mettez à jour la valeur dans le service
    this.router.navigate(['/search']);

  }

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

  // Basculer la boîte de notifications
  toggleNotifications(): void {
    this.notificationsVisible = !this.notificationsVisible;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const notificationsMenu = document.getElementById('notifications-menu');
    const notificationsBtn = document.querySelector('.notification-btn');

    if (notificationsMenu && notificationsBtn) {
      const clickedInsideNotifications =
        notificationsMenu.contains(event.target as Node) ||
        notificationsBtn.contains(event.target as Node);
      if (!clickedInsideNotifications) {
        this.notificationsVisible = false;
      }
    }
  }

  // Charger les catégories depuis le service
  loadCategories(): void {
    this.headerService.getCategories().subscribe(
      (categories) => {
        this.categories = categories.map((category: { subcategories: any[] }) => ({
          ...category,
          subcategories: category.subcategories.filter(
            (subcategory) => subcategory.is_final_child
          ),
        }));
      },
      (error) => {
        console.error('Erreur lors de la récupération des catégories', error);
      }
    );
  }

  // Basculer le menu des catégories
  toggleCategories(): void {
    if (!this.isLoggedIn()) {
      Swal.fire({
        title: 'Attention',
        text: 'Vous devez vous connecter pour accéder aux catégories.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
    } else {
      this.categoriesVisible = !this.categoriesVisible;
      this.selectedCategory = null;
    }
  }

  // Basculer la catégorie sélectionnée
  toggleCategory(category: any): void {
    this.selectedCategory = this.selectedCategory === category ? null : category;
  }

  // Basculer le menu du profil
  toggleProfileMenu(): void {
    this.profileMenuVisible = !this.profileMenuVisible;
  }

  // Navigation
  navigateToCategory(subcategoryId: string): void {
    this.router.navigate([`/products/category/${subcategoryId}`]);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.userRole = null;
    Swal.fire({
      icon: 'success',
      title: 'Déconnexion réussie',
      text: 'Vous avez été déconnecté avec succès.',
      confirmButtonText: 'OK',
    }).then(() => {
      this.router.navigate(['/login']);
    });
  }

  // Vérifier le rôle de l'utilisateur
  isRole(role: string): boolean {
    return this.userRole === role;
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    console.log(this.userRole)
    return this.userRole !== null;
  }
}
