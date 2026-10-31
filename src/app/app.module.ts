import { NgModule, inject, provideAppInitializer, provideBrowserGlobalErrorListeners,provideZoneChangeDetection} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app.component';
import { LoginComponent } from './Components/login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { SignupComponent } from './Components/signup/signup.component';
import { HomeComponent } from './Components/home/home.component';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AppRoutingModule } from './app-routing.module'; 


@NgModule({
  declarations: [App, LoginComponent, SignupComponent, HomeComponent],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([csrfInterceptor, authInterceptor])),
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
  bootstrap: [App],
})
export class AppModule {}
