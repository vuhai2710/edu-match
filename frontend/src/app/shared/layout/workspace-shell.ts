import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

import { SessionService } from '../../core/auth/session';

@Component({
  selector: 'app-workspace-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <!-- Workspace Header -->
      <header class="sticky top-0 z-40 w-full bg-white border-b-2 border-slate-100 px-4 py-2.5 shadow-sm">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Brand -->
          <a routerLink="/" class="flex items-center gap-2 group">
            <div class="w-9 h-9 rounded-xl bg-[#58cc02] flex items-center justify-center shadow-md border-b-3 border-[#4b9b04]">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span class="font-display font-bold text-xl text-[#58cc02]">EduMatch</span>
          </a>

          <!-- Center nav -->
          <nav class="hidden md:flex items-center gap-1">
            @for (link of areaLinks(); track link.href) {
              <a [routerLink]="link.href" routerLinkActive="bg-slate-100 text-slate-900 font-black"
                 class="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wide">
                {{ link.label }}
              </a>
            }
          </nav>

          <!-- Right: profile -->
          <div class="flex items-center gap-3">
            <!-- XP Badge -->
            <div class="hidden sm:flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
              <span class="text-xs font-black text-amber-700">128 XP</span>
            </div>

            <!-- Notification bell -->
            <button class="p-2 rounded-xl hover:bg-slate-100 transition-colors relative">
              <svg class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span class="absolute top-1 right-1 w-2 h-2 bg-duo-red rounded-full"></span>
            </button>

            <!-- Profile avatar -->
            <button (click)="showProfile.set(!showProfile())" class="relative group">
              <div class="w-9 h-9 rounded-full bg-duo-blue text-white flex items-center justify-center font-bold text-sm border-b-2 border-duo-blue-dark">
                {{ initials() }}
              </div>
              <!-- Profile Popover -->
              @if (showProfile()) {
                <div class="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-5 z-50"
                     (click)="$event.stopPropagation()">
                  <div class="text-center mb-3">
                    <div class="w-16 h-16 mx-auto rounded-full bg-duo-blue text-white flex items-center justify-center font-black text-2xl border-b-4 border-duo-blue-dark">
                      {{ initials() }}
                    </div>
                    <p class="mt-2 font-extrabold text-slate-900">{{ session.user()?.fullName ?? 'Người dùng' }}</p>
                    <p class="text-xs text-slate-500">{{ session.user()?.email ?? '' }}</p>
                  </div>
                  <div class="border-t border-slate-100 pt-3 grid gap-1">
                    <a routerLink="/" class="block px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">
                      🏠 Trang chủ
                    </a>
                    <button (click)="logout()" class="w-full text-left px-3 py-2 text-sm font-bold text-duo-red hover:bg-red-50 rounded-lg">
                      🚪 Đăng xuất
                    </button>
                  </div>
                </div>
              }
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class WorkspaceShellComponent {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);
  protected readonly showProfile = signal(false);

  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
    ),
  );

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
      ],
      tutor: [
        { label: 'Dashboard', href: '/tutor/dashboard' },
      ],
      admin: [
        { label: 'Dashboard', href: '/admin/dashboard' },
      ],
    };
    return links[segment] ?? links['student'];
  });

  logout() {
    this.session.clear();
    this.router.navigateByUrl('/auth/login');
  }
}
