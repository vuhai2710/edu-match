import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AuthSessionService } from './core/auth/auth-session.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly authSession = inject(AuthSessionService);
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
  protected readonly currentUser = this.authSession.currentUser;
  protected readonly isAuthRoute = computed(() => this.currentUrl().startsWith('/auth/'));
  protected readonly userMenuOpen = signal(false);

  @HostListener('document:keydown.escape')
  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected goToLogin(): void {
    this.userMenuOpen.set(false);
    void this.router.navigate(['/auth/login'], {
      queryParams: {
        redirect: this.currentUrl()
      }
    });
  }

  protected goToRegister(): void {
    this.userMenuOpen.set(false);
    void this.router.navigate(['/auth/register'], {
      queryParams: {
        redirect: this.currentUrl()
      }
    });
  }

  protected logout(): void {
    this.authSession.logout();
    this.userMenuOpen.set(false);
    void this.router.navigateByUrl('/');
  }
}
