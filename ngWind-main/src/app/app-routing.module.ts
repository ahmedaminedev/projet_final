import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './admin/admin.component';
import {AppComponent} from './app.component';
import {AppRoutes} from './app.routes';
import {PageNotFoundComponent} from './public/page-not-found/page-not-found.component';
import { PublicComponent } from './public/public.component';
import { SigninComponent } from './auth/signin/signin.component';
import { AuthComponent } from './auth/auth.component';
import { PublicHeaderComponent } from './public/layouts/header/header.component';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  {
    path: "admin",
    component: AdminComponent,
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard],
    data: { role: ['ADMIN','SCRAPPER','FOURNISSEUR'] }  // Ajouter le rôle requis ici

  },
  {
    path: '',
    component: PublicComponent,
    loadChildren: () => import('./public/public.module').then((m) => m.PublicModule),

  },
  {
    path: '',
    component: AuthComponent,
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule)
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
      // enableTracing: true, //uncomment for debugging only
    preloadingStrategy: PreloadAllModules,
    scrollPositionRestoration: 'top',
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
