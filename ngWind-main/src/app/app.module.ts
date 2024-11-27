import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {AdminModule} from './admin/admin.module';
import {AppRoutingModule} from './app-routing.module';

import {AppComponent} from './app.component';
import {PublicModule} from './public/public.module';

import { AuthInterceptor } from './auth/auth.interceptor';
import { AuthModule } from './auth/auth.module';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { FullCalendarModule } from '@fullcalendar/angular'; // import FullCalendar module
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalendarModalComponent } from './shared/components/calendar-modal/calendar-modal.component';
import { MatDialogModule ,} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [

    CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory }),
    MatDialogModule,
    MatProgressSpinnerModule,
    BrowserModule,
    AppRoutingModule,
    AdminModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AuthModule,
    CarouselModule,
    FullCalendarModule
    ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
