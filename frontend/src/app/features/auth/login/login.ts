import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { SessionService } from '../../../core/auth/session';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, MascotComponent],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-md space-y-6">
        <!-- Header -->
        <div class="text-center">
          <app-mascot type="eduLogo" [size]="80" />
          <h1 class="mt-4 font-display text-3xl font-black text-slate-900">Đăng nhập</h1>
          <p class="mt-1 text-slate-500">Chào mừng trở lại! Tiếp tục hành trình học tập 🎯</p>
        </div>

        <!-- Form Card -->
        <div class="tactile-card p-6 sm:p-8 space-y-5">
          <!-- Email -->
          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">📧 Email</label>
            <input type="email" [(ngModel)]="email" placeholder="email@example.com"
                   class="tactile-input w-full text-sm font-semibold text-slate-800" />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">🔒 Mật khẩu</label>
            <div class="relative">
              <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" placeholder="Nhập mật khẩu"
                     class="tactile-input w-full text-sm font-semibold text-slate-800 pr-12" />
              <button (click)="showPassword.set(!showPassword())" type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                {{ showPassword() ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <a routerLink="/auth/forgot-password" class="block text-right text-xs font-bold text-duo-blue hover:underline">
            Quên mật khẩu?
          </a>

          <!-- Login Button -->
          <button (click)="onLogin()" [disabled]="isLoading()"
                  class="tactile-button-green w-full py-3.5 rounded-2xl text-base font-extrabold uppercase">
            {{ isLoading() ? '⏳ Đang xử lý...' : '🚀 Đăng nhập' }}
          </button>

          <!-- Divider -->
          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-400 uppercase">Hoặc</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <!-- Google Login -->
          <button class="tactile-button-gray w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Đăng nhập bằng Google
          </button>
        </div>

        <!-- Register link -->
        <p class="text-center text-sm text-slate-500">
          Chưa có tài khoản?
          <a routerLink="/auth/register/student" class="font-extrabold text-[#58cc02] hover:underline"> Đăng ký ngay!</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginPage {
  email = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);

  private router = inject(Router);
  private session = inject(SessionService);

  onLogin() {
    if (!this.email || !this.password) return;
    this.isLoading.set(true);
    // TODO: wire to real AuthApiService.login()
    setTimeout(() => this.isLoading.set(false), 1500);
  }
}
