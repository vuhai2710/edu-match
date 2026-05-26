import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '../../../api/facades/auth-api';
import { SessionService } from '../../../core/auth/session';
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-sign-in-button/google-sign-in-button';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, MascotComponent, LucideEye, LucideEyeOff, GoogleSignInButtonComponent],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-md space-y-6">
        <div class="text-center">
          <app-mascot type="eduLogo" [size]="80" />
          <h1 class="mt-4 font-display text-3xl font-black text-slate-900">Đăng nhập</h1>
          <p class="mt-1 text-slate-500">Chào mừng trở lại! Tiếp tục hành trình học tập.</p>
        </div>

        <div class="tactile-card p-6 sm:p-8 space-y-5">
          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Email</label>
            <input type="email" [(ngModel)]="email" placeholder="email@example.com"
                   class="tactile-input w-full text-sm font-semibold text-slate-800" />
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu</label>
            <div class="relative">
              <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" placeholder="Nhập mật khẩu"
                     class="tactile-input w-full text-sm font-semibold text-slate-800 pr-12" />
              <button (click)="showPassword.set(!showPassword())" type="button"
                      [attr.aria-label]="showPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                      class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-duo-blue">
                @if (showPassword()) {
                  <svg lucideEyeOff class="h-5 w-5"></svg>
                } @else {
                  <svg lucideEye class="h-5 w-5"></svg>
                }
              </button>
            </div>
          </div>

          <a routerLink="/auth/forgot-password" class="block text-right text-xs font-bold text-duo-blue hover:underline">
            Quên mật khẩu?
          </a>

          <button (click)="onLogin()" [disabled]="isLoading()"
                  class="tactile-button-green w-full py-3.5 rounded-2xl text-base font-extrabold uppercase disabled:opacity-60">
            {{ isLoading() ? 'Đang xử lý...' : 'Đăng nhập' }}
          </button>

          @if (errorMessage()) {
            <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
              {{ errorMessage() }}
            </p>
          }

          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-400 uppercase">Hoặc</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <app-google-sign-in-button text="signin_with" (credential)="onGoogleCredential($event)" />
        </div>

        <p class="text-center text-sm text-slate-500">
          Chưa có tài khoản?
          <a routerLink="/auth/register" class="font-extrabold text-[#58cc02] hover:underline"> Đăng ký ngay</a>
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
  errorMessage = signal('');

  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);

  async onLogin(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.errorMessage.set('Vui lòng nhập email và mật khẩu.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.authApi.login({
          email: this.email.trim(),
          password: this.password,
        }),
      );
      const login = unwrapApiData(response);
      this.session.bootstrapFromLogin(login);

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl || this.defaultRouteForRole(login.user.role));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Đăng nhập thất bại.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async onGoogleCredential(accessToken: string): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.authApi.googleLogin({
          accessToken,
          registrationIntent: false,
        }),
      );
      const login = unwrapApiData(response);
      this.session.bootstrapFromLogin(login);

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl || this.defaultRouteForRole(login.user.role));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Đăng nhập Google thất bại.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private defaultRouteForRole(role: UserRole): string {
    if (role === UserRole.Tutor) return '/tutor/dashboard';
    if (role === UserRole.Admin) return '/admin/dashboard';
    return '/student/dashboard';
  }
}
