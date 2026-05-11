import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

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

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isAuthenticated = this.authSession.isAuthenticated;
  protected readonly isAuthRoute = computed(() => this.currentUrl().startsWith('/auth/'));
  protected readonly lastApiError = this.apiErrors.lastError;

  protected clearApiError(): void {
    this.apiErrors.clear();
  }
}
