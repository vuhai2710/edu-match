import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, startWith } from 'rxjs';

import { AuthApiService } from '../../api/facades/auth-api';
import { NotificationsService } from '../../api/generated/client/services';
import { UserRole } from '../../core/auth/session.models';
import { SessionService } from '../../core/auth/session';

@Component({
  selector: 'app-workspace-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header class="sticky top-0 z-40 w-full bg-white border-b-2 border-slate-100 px-4 py-2.5 shadow-sm">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <a [routerLink]="dashboardRoute()" class="flex items-center gap-2 group">
            <div class="w-9 h-9 rounded-xl bg-[#58cc02] flex items-center justify-center shadow-md border-b-3 border-[#4b9b04]">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span class="font-display font-bold text-xl text-[#58cc02]">EduMatch</span>
          </a>

          <nav class="hidden md:flex items-center gap-1">
            @for (link of areaLinks(); track link.href) {
              <a [routerLink]="link.href" routerLinkActive="bg-slate-100 text-slate-900 font-black"
                 class="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wide">
                {{ link.label }}
              </a>
            }
          </nav>

          <div class="flex items-center gap-3">
            @if (session.role() === userRole.Student) {
              <a routerLink="/student/notifications" class="p-2 rounded-xl hover:bg-slate-100 transition-colors relative">
                <svg class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                @if (unreadCount() > 0) {
                  <span class="absolute -top-1 -right-1 min-w-5 h-5 bg-duo-red text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                    {{ unreadCount() }}
                  </span>
                }
              </a>
            }

            <div class="relative" (click)="$event.stopPropagation()">
              <button type="button"
                      (click)="showProfile.set(!showProfile())"
                      [attr.aria-expanded]="showProfile()"
                      aria-haspopup="menu"
                      class="group">
              <div class="w-9 h-9 rounded-full bg-duo-blue text-white flex items-center justify-center font-bold text-sm border-b-2 border-duo-blue-dark">
                {{ initials() }}
              </div>
              </button>
              @if (showProfile()) {
                <div class="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-5 z-50"
                     role="menu"
                     (click)="$event.stopPropagation()">
                  <div class="text-center mb-3">
                    <div class="w-16 h-16 mx-auto rounded-full bg-duo-blue text-white flex items-center justify-center font-black text-2xl border-b-4 border-duo-blue-dark">
                      {{ initials() }}
                    </div>
                    <p class="mt-2 font-extrabold text-slate-900">{{ session.user()?.fullName ?? 'Người dùng' }}</p>
                    <p class="text-xs text-slate-500">{{ session.user()?.email ?? '' }}</p>
                  </div>
                  <div class="border-t border-slate-100 pt-3 grid gap-1">
                    <a [routerLink]="settingsRoute()" (click)="showProfile.set(false)" class="block px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">
                      Hồ sơ
                    </a>
                    <a [routerLink]="dashboardRoute()" (click)="showProfile.set(false)" class="block px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">
                      Trang chủ
                    </a>
                    <button (click)="logout()" class="w-full text-left px-3 py-2 text-sm font-bold text-duo-red hover:bg-red-50 rounded-lg">
                      Đăng xuất
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </header>

      <main class="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class WorkspaceShellComponent implements OnInit {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly notificationsApi = inject(NotificationsService);
  private readonly authApi = inject(AuthApiService);
  protected readonly showProfile = signal(false);
  protected readonly unreadCount = signal(0);
  protected readonly userRole = UserRole;

  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
    ),
  );

  ngOnInit(): void {
    void this.loadUnreadCount();
  }

  @HostListener('document:click')
  protected closeProfileDropdown(): void {
    this.showProfile.set(false);
  }

  protected readonly initials = computed(() => {
    const name = this.session.user()?.fullName;
    if (!name) return '?';
    return name.split(' ').slice(-2).map(s => s[0]).join('').toUpperCase();
  });

  protected readonly areaLinks = computed(() => {
    this.navigation();
    const segment = this.router.url.split('/').filter(Boolean)[0] ?? 'student';
    const links: Record<string, Array<{ label: string; href: string }>> = {
      student: [
        { label: 'Dashboard', href: '/student/dashboard' },
        { label: 'Tìm gia sư', href: '/student/discover' },
        { label: 'Yêu cầu', href: '/student/learning-requests' },
        { label: 'Lớp học', href: '/student/classes' },
        { label: 'Chat', href: '/student/chat' },
      ],
      tutor: [
        { label: 'Dashboard', href: '/tutor/dashboard' },
        { label: 'Lớp dạy', href: '/tutor/classes' },
      ],
      admin: [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { label: 'Người dùng', href: '/admin/users' },
        { label: 'Môn học', href: '/admin/subjects' },
        { label: 'Chính sách cọc', href: '/admin/deposit-policy' },
        { label: 'Lớp học', href: '/admin/classes' },
        { label: 'Yêu cầu hủy', href: '/admin/cancellation-requests' },
        { label: 'Thanh toán', href: '/admin/payments' },
      ],
    };
    return links[segment] ?? links['student'];
  });

  protected settingsRoute(): string {
    if (this.session.role() === UserRole.Student) return '/student/settings';
    if (this.session.role() === UserRole.Tutor) return '/tutor/settings';
    return '/admin/settings';
  }

  protected dashboardRoute(): string {
    if (this.session.role() === UserRole.Tutor) return '/tutor/dashboard';
    if (this.session.role() === UserRole.Admin) return '/admin/dashboard';
    return '/student/dashboard';
  }

  async logout(): Promise<void> {
    const refreshToken = this.session.refreshToken();
    try {
      if (refreshToken) {
        await firstValueFrom(this.authApi.logout({ refreshToken }));
      }
    } catch {
      // Local logout should still proceed if the token is already invalid.
    }
    this.session.clear();
    await this.router.navigateByUrl('/auth/login');
  }

  private async loadUnreadCount(): Promise<void> {
    try {
      const response = await firstValueFrom(this.notificationsApi.getUnreadNotificationCount());
      this.unreadCount.set(response.data ?? 0);
    } catch {
      this.unreadCount.set(0);
    }
  }
}
