import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AdminRoutingModule } from './admin-routing.module';
import { LayoutsModule } from './layouts/layouts.module';

import { AdminComponent } from './admin.component';
import { AdminPageNotFoundComponent } from './views/admin-page-not-found/admin-page-not-found.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { SettingsModule } from './views/settings/settings.module';


@NgModule({
  declarations: [
    AdminComponent,
    DashboardComponent,
    AdminPageNotFoundComponent,

  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    LayoutsModule,
    SettingsModule,
  ]
})
export class AdminModule { }
