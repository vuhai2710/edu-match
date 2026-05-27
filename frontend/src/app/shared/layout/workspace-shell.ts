import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, startWith } from 'rxjs';

import { AuthApiService } from '../../api/facades/auth-api';
import { ChatService, NotificationsService } from '../../api/generated/client/services';
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
            <!-- Notifications Bell -->
            <a [routerLink]="notificationsRoute()" class="p-2 rounded-xl hover:bg-slate-100 transition-colors relative">
              <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              @if (unreadCount() > 0) {
                <span class="absolute top-1 right-1 w-4 h-4 bg-[#ff4b4b] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                  {{ unreadCount() }}
                </span>
              }
            </a>

            <!-- Chat Bubble -->
            <a [routerLink]="chatRoute()" class="p-2 rounded-xl hover:bg-slate-100 transition-colors relative">
              <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              @if (unreadChatCount() > 0) {
                <span class="absolute top-1 right-1 w-4 h-4 bg-[#ff9600] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                  {{ unreadChatCount() }}
                </span>
              }
            </a>

            <!-- Vertical divider -->
            <div class="h-6 w-[1.5px] bg-[#e1e9f1] mx-2"></div>

            <!-- Avatar & Profile Dropdown Button -->
            <div class="relative" (click)="$event.stopPropagation()">
              <button type="button"
                      (click)="showProfile.set(!showProfile())"
                      [attr.aria-expanded]="showProfile()"
                      aria-haspopup="menu"
                      class="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors group">
                <!-- Circle Avatar wrapper -->
                <div class="w-10 h-10 rounded-full bg-[#f0f4f9] border border-[#e1e9f1] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-[#c5d6e6] transition-colors">
                  @if (session.user()?.avatarUrl && !avatarError()) {
                    <img [src]="session.user()?.avatarUrl" alt="Avatar" referrerpolicy="no-referrer" (error)="avatarError.set(true)" class="w-full h-full object-cover" />
                  } @else {
                    <svg class="w-6 h-6 text-[#58cc02]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="11" cy="8" r="3.5" />
                      <path d="M4 19a7 7 0 0 1 12.5-4.5" />
                      <path d="M16 16l2.5 2.5 4.5-4.5" />
                    </svg>
                  }
                </div>

                <!-- User Info text -->
                <div class="text-left hidden sm:block">
                  <div class="font-extrabold text-sm text-[#3c3c3c] leading-tight group-hover:text-slate-900 transition-colors">
                    {{ session.user()?.fullName }}
                  </div>
                  <div class="text-[10px] font-bold text-[#777777] uppercase tracking-wider mt-0.5">
                    {{ roleLabel() }}
                  </div>
                </div>
              </button>

              <!-- Profile Dropdown overlay -->
              @if (showProfile()) {
                <div class="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-5 z-50"
                     role="menu"
                     (click)="$event.stopPropagation()">
                  <div class="text-center mb-3">
                    <!-- Circle Avatar inside dropdown -->
                    <div class="w-16 h-16 mx-auto rounded-full bg-[#f0f4f9] border border-[#e1e9f1] flex items-center justify-center shrink-0 overflow-hidden">
                      @if (session.user()?.avatarUrl && !avatarError()) {
                        <img [src]="session.user()?.avatarUrl" alt="Avatar" referrerpolicy="no-referrer" (error)="avatarError.set(true)" class="w-full h-full object-cover" />
                      } @else {
                        <svg class="w-10 h-10 text-[#58cc02]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="11" cy="8" r="3.5" />
                          <path d="M4 19a7 7 0 0 1 12.5-4.5" />
                          <path d="M16 16l2.5 2.5 4.5-4.5" />
                        </svg>
                      }
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
  private readonly chatApi = inject(ChatService);
  private readonly authApi = inject(AuthApiService);
  protected readonly showProfile = signal(false);
  protected readonly avatarError = signal(false);
  protected readonly unreadCount = signal(0);
  protected readonly unreadChatCount = signal(0);
  protected readonly userRole = UserRole;

  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
    ),
  );

  ngOnInit(): void {
    void this.loadUnreadCount();
    void this.loadUnreadChatCount();
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

  protected readonly roleLabel = computed(() => {
    const role = this.session.role();
    if (role === UserRole.Student) return 'HỌC VIÊN';
    if (role === UserRole.Tutor) return 'GIA SƯ';
    if (role === UserRole.Admin) return 'ADMIN';
    return '';
  });

  protected notificationsRoute(): string {
    const role = this.session.role();
    if (role === UserRole.Tutor) return '/tutor/notifications';
    if (role === UserRole.Admin) return '/admin/notifications';
    return '/student/notifications';
  }

  protected chatRoute(): string {
    const role = this.session.role();
    if (role === UserRole.Tutor) return '/tutor/chat';
    if (role === UserRole.Admin) return '/admin/chat';
    return '/student/chat';
  }

  protected readonly areaLinks = computed(() => {
    this.navigation();
    const segment = this.router.url.split('/').filter(Boolean)[0] ?? 'student';
    const links: Record<string, Array<{ label: string; href: string }>> = {
      student: [
        { label: 'Dashboard', href: '/student/dashboard' },
        { label: 'Tìm gia sư', href: '/student/discover' },
        { label: 'Yêu cầu', href: '/student/learning-requests' },
        { label: 'Lớp học', href: '/student/classes' },
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

  private async loadUnreadChatCount(): Promise<void> {
    try {
      const response = await firstValueFrom(this.chatApi.getConversations());
      const totalUnread = (response.data ?? []).reduce((acc, conv) => acc + (conv.unreadCount ?? 0), 0);
      this.unreadChatCount.set(totalUnread);
    } catch {
      this.unreadChatCount.set(0);
    }
  }
}
