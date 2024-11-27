import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SpinnerComponent } from '../shared/components/spinner/spinner.component';
import { ValidationErrorComponent } from '../shared/components/validation-error/validation-error.component';
import { AlertComponent } from '../shared/components/alert/alert.component';
import { RouterOutlet } from '@angular/router';
import { PublicFooterComponent } from '../public/layouts/footer/footer.component';
import { PublicHeaderComponent } from '../public/layouts/header/header.component';
import { AuthComponent } from './auth.component';



@NgModule({
  declarations: [
    SigninComponent,
    SignupComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    SpinnerComponent,
    ValidationErrorComponent,
    AlertComponent,
    RouterOutlet,
    FormsModule,
  ],
  exports: [
    SigninComponent,
    SignupComponent,
  ]
})
export class AuthModule { }
