import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from '../auth/auth.guard';
import { CatalogComponent } from './catalog/catalog.component';
import { ContactComponent } from './contact/contact.component';
import { DetailProductComponent } from './detail-product/detail-product.component';
import { FavoriteComponent } from './favorite/favorite.component';
import { SearchComponent } from './search/search.component';
import { MagicComponent } from './magic/magic.component';
import { ProfileClientComponent } from './profile-client/profile-client.component';
import { FournisseurStatsComponent } from './fournisseur-stats/fournisseur-stats.component';

const routes: Routes = [

  {
    path: '',
    title: 'Home',
    component: HomeComponent,
  },
  {
    path: 'products/category/:categoryId',
    title: 'catalog',
    component: CatalogComponent,
    canActivate: [AuthGuard],
    data: { role: ['CLIENT','ADMIN','SCRAPPER','FOURNISSEUR'] }  // Ajouter le rôle requis ici
  },
  {
    path: 'products/details/:productId',
    title: 'detail',
    component: DetailProductComponent,
    canActivate: [AuthGuard],
    data: { role: ['CLIENT','ADMIN','SCRAPPER','FOURNISSEUR'] }  // Ajouter le rôle requis ici
  },
  {
    path: 'search',
    title: 'search',
    component: SearchComponent,
    canActivate: [AuthGuard],
    data: { role: ['CLIENT','ADMIN','SCRAPPER','FOURNISSEUR'] }  // Ajouter le rôle requis ici
  },
  {
    path: 'magicsearch',
    title: 'magicsearch',
    component: MagicComponent,
    canActivate: [AuthGuard],
    data: { role: ['CLIENT','ADMIN','SCRAPPER','FOURNISSEUR'] }  // Ajouter le rôle requis ici
  },
  {
    path: 'favories',
    title: 'favories',
    component: FavoriteComponent,
    canActivate: [AuthGuard],
    data: { role: ['CLIENT'] }  // Ajouter le rôle requis ici
  },
  {
    path: 'stats-fournisseur',
    title: 'stats-fournisseur',
    component: FournisseurStatsComponent,
    canActivate: [AuthGuard],
    data: { role: ['FOURNISSEUR'] }  // Ajouter le rôle requis ici
  },
  {
    path: 'profile',
    title: 'favoprofileries',
    component: ProfileClientComponent,
    canActivate: [AuthGuard],
    data: { role: ['CLIENT','FOURNISSEUR'] }  // Ajouter le rôle requis ici
  },
  {
    path: 'contact',
    title: 'contact',
    component: ContactComponent,

  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {}
