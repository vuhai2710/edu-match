import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-[var(--app-bg)] text-slate-900">
      <header class="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <a class="flex items-center gap-3" routerLink="/">
            <span class="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
              EM
            </span>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                EduMatch
              </p>
              <p class="text-sm text-slate-700">Angular 21 frontend scaffold</p>
            </div>
          </a>

          <nav class="hidden items-center gap-2 md:flex">
            <a class="nav-link" routerLink="/" routerLinkActive="nav-link-active" [routerLinkActiveOptions]="{ exact: true }">
              Trang chủ
            </a>
            <a class="nav-link" routerLink="/auth/login" routerLinkActive="nav-link-active">
              Đăng nhập
            </a>
            <a class="nav-link" routerLink="/auth/register/student" routerLinkActive="nav-link-active">
              Học viên
            </a>
            <a class="nav-link" routerLink="/auth/register/tutor" routerLinkActive="nav-link-active">
              Gia sư
            </a>
          </nav>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PublicShellComponent {}
