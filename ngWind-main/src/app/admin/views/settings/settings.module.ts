import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { UsersComponent } from './users/users.component';
import { GestionFournisseursComponent } from './gestion-fournisseurs/gestion-fournisseurs.component';
import { CalendarModule } from 'angular-calendar';



@NgModule({
  declarations: [
    ProfileComponent,
    UsersComponent,


  ],
  imports: [
    CommonModule,
  ],
  exports: [
    ProfileComponent
  ]

})
export class SettingsModule { }
