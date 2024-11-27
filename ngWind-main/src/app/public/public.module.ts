import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PublicFooterComponent } from './layouts/footer/footer.component';
import { PublicHeaderComponent } from './layouts/header/header.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PublicRoutingModule } from './public-routing.module';
import { PublicComponent } from './public.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@NgModule({
  declarations: [PublicComponent, PageNotFoundComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatGridListModule,
    MatToolbarModule,
    MatMenuModule,
    CommonModule,
    PublicRoutingModule,
    PublicHeaderComponent,
    PublicFooterComponent,
    RouterOutlet,
  ],
})
export class PublicModule {}
