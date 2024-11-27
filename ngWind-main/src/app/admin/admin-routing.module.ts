import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminRoutes, ElementRoutes, SettingRoutes } from './admin.routes';
import { AdminPageNotFoundComponent } from './views/admin-page-not-found/admin-page-not-found.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { GestionFournisseursComponent } from './views/settings/gestion-fournisseurs/gestion-fournisseurs.component';
import { GestionScrappersComponent } from './views/settings/gestion-scrappers/gestion-scrappers.component';
import { GestionPagesComponent } from './views/settings/gestion-pages/gestion-pages.component';
import { GestionCategoriesComponent } from './views/settings/gestion-categories/gestion-categories.component';
import { CalendarModalComponent } from '../shared/components/calendar-modal/calendar-modal.component';
import { GestionProduitsPagesComponent } from './views/settings/gestion-produits-pages/gestion-produits-pages.component';
import { AuthGuard } from '../auth/auth.guard';
import { GestionReclamationsComponent } from './views/settings/gestion-reclamations/gestion-reclamations.component';
import { ConsultFournisseurByScraperComponent } from './views/settings/consult-fournisseur-by-scraper/consult-fournisseur-by-scraper.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: AdminRoutes.Dashboard,
    pathMatch: 'full',
  },
  {
    title: 'Dashboard',
    path: AdminRoutes.Dashboard,
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { role: [,'ADMIN','SCRAPPER',] }  // Ajouter le rôle requis ici

  },
  {
    path: AdminRoutes.Settings,
    children: [
      {
        title: 'gestionfournisseurs',
        path: SettingRoutes.GestionFournisseur,
        component: GestionFournisseursComponent,
        canActivate: [AuthGuard],
        data: { role: ['ADMIN'] }  // Ajouter le rôle requis ici
      },
      {
        title: 'consultfournisseurs',
        path: SettingRoutes.ConsultFournisseurs,
        component: ConsultFournisseurByScraperComponent,
        canActivate: [AuthGuard],
        data: { role: ['SCRAPPER'] }  // Ajouter le rôle requis ici
      },
      {
        title: 'gestionscrapers',
        path: SettingRoutes.GestionScrapers,
        component: GestionScrappersComponent,
        canActivate: [AuthGuard],
        data: { role: [,'ADMIN','SCRAPPER',] }  // Ajouter le rôle requis ici
      },
      {
        title: 'gestionpages',
        path: SettingRoutes.GestionPages,
        component: GestionPagesComponent,
        canActivate: [AuthGuard],
        data: { role: [,'ADMIN','SCRAPPER',] }  // Ajouter le rôle requis ici
      },
      {
        title: 'gestioncategories',
        path: SettingRoutes.GestionCategories,
        component: GestionCategoriesComponent,
        canActivate: [AuthGuard],
        data: { role: [,'ADMIN','SCRAPPER',] }  // Ajouter le rôle requis ici
      },
      {
        title: 'gestionreclamations',
        path: SettingRoutes.GestionReclamations,
        component: GestionReclamationsComponent,
        canActivate: [AuthGuard],
        data: { role: [,'ADMIN','SCRAPPER',] }  // Ajouter le rôle requis ici
      },

    ],
  },
  {
    title: 'GestionProduits',
    path: 'settings/gestionproducts/page/:pageId',
    component: GestionProduitsPagesComponent,
    canActivate: [AuthGuard],
    data: { role: [,'ADMIN','SCRAPPER',] }  // Ajouter le rôle requis ici
  },
  { path: 'calendar', component: CalendarModalComponent },

  { path: '**', component: AdminPageNotFoundComponent },
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
