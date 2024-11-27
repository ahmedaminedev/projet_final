import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/_core/services/common.service';
import { AppRoutes } from 'src/app/app.routes';
import { AdminRoutes, ElementRoutes, SettingRoutes } from '../../admin.routes';
import { AuthService } from 'src/app/auth/auth.service';
import { HeaderService } from 'src/app/public/layouts/header/header.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  sidebarIsCollapsed: boolean = true;
  readonly appRoutes = AppRoutes;
  readonly adminRoutes = AdminRoutes;
  readonly settingRoutes = SettingRoutes;
  readonly elementRoutes = ElementRoutes;
  private routerSubscription: Subscription = new Subscription();
  userRole: string | null = null;
  currentUser = this.authService.currentUserValue;
  @Output() sidebarCollapsed = new EventEmitter<boolean>();

  constructor(
    public readonly commonServices: CommonService,
    private readonly elementRef: ElementRef,
    private router: Router,
    private authService: AuthService,
    private headerService: HeaderService,
  ) {}

  ngOnInit(): void {
    this.userRole = this.currentUser.user.role;

  }

  ngAfterViewInit(): void {
    this.subMenuToggleHandlerOnRouteChange();
    setTimeout(() => {
      this.subMenuToggleHandlerOnPageReload();
    }, 1);
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  subMenuToggleHandler = (event: MouseEvent): void => {
    const elem = event.target as HTMLElement;
    const subMenu = elem.closest("a.sub-menu") as Element;

    if (subMenu) {
      const isExpanded = subMenu.getAttribute('aria-expanded') === 'true';
      subMenu.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    }
  }

  subMenuToggleHandlerOnPageReload = (): void => {
    const currentPageElem = this.elementRef.nativeElement.querySelector('[aria-current="page"]');

    if (currentPageElem) {
      const closestSubMenu = currentPageElem.closest('ul.sub-menu-item') as Element;

      if (closestSubMenu && closestSubMenu.previousSibling) {
        const subMenu = closestSubMenu.previousSibling as Element;
        subMenu?.setAttribute('aria-expanded', 'true');
      }
    }
  }

  subMenuToggleHandlerOnRouteChange = (): void => {
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const subMenus = this.elementRef.nativeElement.querySelectorAll(".sub-menu");
        const currentLinkElem = this.elementRef.nativeElement.querySelector(`[href='${event.url}']`) as Element;

        if (currentLinkElem && currentLinkElem.closest('ul.sub-menu-item')) return;

        subMenus.forEach((subMenu: Element) => {
          if (subMenu.getAttribute('aria-expanded') === 'true') {
            subMenu.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
  }


  getNavigationRoute(): string {
    if (this.isRole('ADMIN')) {
      return this.commonServices.prepareRoute(this.appRoutes.Admin, this.adminRoutes.Settings, this.settingRoutes.GestionFournisseur);
    } else if (this.isRole('SCRAPPER')) {
      return this.commonServices.prepareRoute(this.appRoutes.Admin, this.adminRoutes.Settings, this.settingRoutes.ConsultFournisseurs);
    }
    return ''; // Default route or handle if the role is unknown
  }


  isLoggedIn(): boolean {
    return this.userRole !== null;
  }

    // Vérifier le rôle de l'utilisateur
    isRole(role: string): boolean {
      return this.userRole === role;
    }



}
