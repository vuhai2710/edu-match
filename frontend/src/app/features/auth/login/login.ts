import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '../../../api/facades/auth-api';
import { SessionService } from '../../../core/auth/session';
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorDetails, getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-sign-in-button/google-sign-in-button';

@Component({
  selector: 'app-login-page',
  imports: [
    FormsModule,
    RouterLink,
    LucideEye,
    LucideEyeOff,
    GoogleSignInButtonComponent,
  ],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-md space-y-6">
        @if (pendingTutorStatus(); as status) {
          <div class="tactile-card p-8 text-center space-y-6">
            @if (status === 'Pending') {
              <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-duo-orange">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class="font-display text-2xl font-black text-slate-800">Đang chờ phê duyệt</h2>
              <p class="text-sm text-slate-600 font-bold leading-relaxed">
                {{ pendingTutorMessage() || 'Tài khoản gia sư của bạn đang chờ quản trị viên phê duyệt. Vui lòng quay lại sau.' }}
              </p>
              <div class="pt-2">
                <button (click)="pendingTutorStatus.set(null)" class="tactile-button-blue w-full py-3 rounded-xl text-sm font-extrabold uppercase">
                  Quay lại đăng nhập
                </button>
              </div>
            } @else if (status === 'Rejected') {
              <div class="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-duo-red">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class="font-display text-2xl font-black text-slate-800">Hồ sơ bị từ chối</h2>
              <p class="text-sm text-slate-600 font-bold leading-relaxed">
                {{ pendingTutorMessage() || 'Tài khoản gia sư của bạn đã bị từ chối phê duyệt.' }}
              </p>
              <p class="text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100 leading-normal">
                Lưu ý: Bạn có thể đăng ký lại làm gia sư bằng tài khoản này. Hệ thống sẽ tự động cập nhật lại thông tin mới nhất của bạn.
              </p>
              <div class="space-y-2 pt-2">
                <a routerLink="/auth/register/tutor" class="tactile-button-green block text-center w-full py-3 rounded-xl text-sm font-extrabold uppercase">
                  Đăng ký lại làm Gia sư
                </a>
                <button (click)="pendingTutorStatus.set(null)" class="tactile-button-ghost w-full py-3 rounded-xl text-sm font-extrabold uppercase text-slate-600">
                  Quay lại đăng nhập
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="text-center">
            <h1 class="font-display text-3xl font-black text-slate-900">Đăng nhập</h1>
            <p class="mt-1 text-slate-500">Chào mừng trở lại! Tiếp tục hành trình học tập.</p>
          </div>

          <form (ngSubmit)="onLogin()" class="tactile-card p-6 sm:p-8 space-y-5">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="user@gmail.com"
                class="tactile-input w-full text-sm font-semibold text-slate-800"
              />
              @if (emailError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ emailError() }}</span>
              }
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu</label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  class="tactile-input w-full text-sm font-semibold text-slate-800 pr-12"
                />
                <button
                  (click)="showPassword.set(!showPassword())"
                  type="button"
                  [attr.aria-label]="showPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                  class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-duo-blue"
                >
                  @if (showPassword()) {
                    <svg lucideEyeOff class="h-5 w-5"></svg>
                  } @else {
                    <svg lucideEye class="h-5 w-5"></svg>
                  }
                </button>
              </div>
              @if (passwordError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ passwordError() }}</span>
              }
            </div>

            <a
              routerLink="/auth/forgot-password"
              class="block text-right text-xs font-bold text-duo-blue hover:underline"
            >
              Quên mật khẩu?
            </a>

            <button
              type="submit"
              [disabled]="isLoading()"
              class="tactile-button-green w-full py-3.5 rounded-2xl text-base font-extrabold uppercase disabled:opacity-60"
            >
              {{ isLoading() ? 'Đang xử lý...' : 'Đăng nhập' }}
            </button>

            @if (errorMessage()) {
              <p
                class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red"
              >
                {{ errorMessage() }}
              </p>
            }

            <div class="flex items-center gap-4">
              <div class="flex-1 h-px bg-slate-200"></div>
              <span class="text-xs font-bold text-slate-400 uppercase">Hoặc</span>
              <div class="flex-1 h-px bg-slate-200"></div>
            </div>

            <app-google-sign-in-button text="signin_with" (credential)="onGoogleCredential($event)" />
          </form>

          <p class="text-center text-sm text-slate-500">
            Chưa có tài khoản?
            <a routerLink="/auth/register" class="font-extrabold text-[#58cc02] hover:underline">
              Đăng ký ngay</a
            >
          </p>
        }
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
  emailError = signal('');
  passwordError = signal('');
  pendingTutorStatus = signal<'Pending' | 'Rejected' | null>(null);
  pendingTutorMessage = signal('');

  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);

  async onLogin(): Promise<void> {
    this.emailError.set('');
    this.passwordError.set('');
    this.errorMessage.set('');

    let isValid = true;
    if (!this.email.trim()) {
      this.emailError.set('Vui lòng nhập email.');
      isValid = false;
    }
    if (!this.password) {
      this.passwordError.set('Vui lòng nhập mật khẩu.');
      isValid = false;
    }

    if (!isValid) return;

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.email.trim())) {
      this.emailError.set('Email không đúng định dạng.');
      return;
    }

    this.isLoading.set(true);

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
      const details = getApiErrorDetails(error);
      const isPending = details.errorCode === 'TUTOR_PENDING_APPROVAL' ||
                        details.errorCode === 'TUTOR_REGISTRATION_PENDING' ||
                        details.message.includes('chờ quản trị viên phê duyệt') ||
                        details.message.includes('phê duyệt hồ sơ');
      if (isPending) {
        this.pendingTutorStatus.set('Pending');
        this.pendingTutorMessage.set(details.message);
        return;
      }

      const isRejected = details.errorCode === 'TUTOR_REJECTED' ||
                         details.message.includes('bị từ chối phê duyệt');
      if (isRejected) {
        this.pendingTutorStatus.set('Rejected');
        this.pendingTutorMessage.set(details.message);
        return;
      }

      const errMsg = details.message;
      if (errMsg.toLowerCase().includes('mật khẩu') || errMsg.toLowerCase().includes('password')) {
        this.passwordError.set(errMsg);
      } else if (errMsg.toLowerCase().includes('email') || errMsg.toLowerCase().includes('tài khoản')) {
        this.emailError.set(errMsg);
      } else {
        this.errorMessage.set(errMsg);
      }
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
      const details = getApiErrorDetails(error);
      const isPending = details.errorCode === 'TUTOR_PENDING_APPROVAL' ||
                        details.errorCode === 'TUTOR_REGISTRATION_PENDING' ||
                        details.message.includes('chờ quản trị viên phê duyệt') ||
                        details.message.includes('phê duyệt hồ sơ');
      if (isPending) {
        this.pendingTutorStatus.set('Pending');
        this.pendingTutorMessage.set(details.message);
        return;
      }

      const isRejected = details.errorCode === 'TUTOR_REJECTED' ||
                         details.message.includes('bị từ chối phê duyệt');
      if (isRejected) {
        this.pendingTutorStatus.set('Rejected');
        this.pendingTutorMessage.set(details.message);
        return;
      }
      this.errorMessage.set(details.message);
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
