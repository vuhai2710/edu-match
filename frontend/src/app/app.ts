import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { environment } from '../environments/environment';
import { AuthSessionService } from './core/auth/auth-session.service';
import { ApiErrorService } from './core/http/api-error.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly authSession = inject(AuthSessionService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly router = inject(Router);

  protected readonly apiBaseUrl = environment.apiBaseUrl;
  protected readonly currentUser = this.authSession.currentUser;
  protected readonly isAuthenticated = this.authSession.isAuthenticated;
  protected readonly lastApiError = this.apiErrors.lastError;

  protected clearApiError(): void {
    this.apiErrors.clear();
  }

  protected logout(): void {
    this.authSession.logout();
    void this.router.navigateByUrl('/tutors');
  }
}
