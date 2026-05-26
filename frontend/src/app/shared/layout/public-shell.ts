import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <!-- Duolingo-style Header -->
      <header class="sticky top-0 z-40 w-full bg-white border-b-2 border-slate-100 px-4 py-3 shadow-sm">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Brand Logo -->
          <a routerLink="/" class="flex items-center gap-2 group">
            <div class="w-10 h-10 rounded-xl bg-[#58cc02] flex items-center justify-center shadow-md border-b-4 border-[#4b9b04] group-hover:animate-bounce group-active:translate-y-0.5 group-active:border-b-0">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span class="font-display font-black text-2xl text-[#58cc02] tracking-tight">EduMatch</span>
          </a>

          <!-- Nav Controls -->
          <nav class="flex items-center gap-2 md:gap-4">
            <a routerLink="/" routerLinkActive="text-duo-green border-b-2 border-duo-green font-black pb-1"
               [routerLinkActiveOptions]="{ exact: true }"
               class="hidden md:block text-sm font-extrabold text-slate-500 hover:text-slate-800 transition-colors uppercase">
              Trang chủ
            </a>
            <a routerLink="/auth/login"
               class="px-4 py-2 text-sm font-extrabold uppercase bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Đăng nhập
            </a>
            <a routerLink="/auth/register"
               class="tactile-button-green px-4 py-2 rounded-xl text-sm font-extrabold uppercase hidden sm:inline-flex">
              Đăng ký
            </a>
          </nav>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-grow">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PublicShellComponent {}
