import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgxStripeModule } from 'ngx-stripe';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HttpClientModule } from '@angular/common/http';
import { CreateTokenComponent } from './components/create-token/create-token.component';
import { CustomerDashboardComponent } from './components/customer-dashboard/customer-dashboard.component';
import { PlanPickerComponent } from './components/plan-picker/plan-picker.component';
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreateTokenComponent,
    CustomerDashboardComponent,
    PlanPickerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxStripeModule.forRoot('publishable key')
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
