import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '../../../api/facades/auth-api';
import { getApiErrorMessage } from '../../../core/http/api-error';

@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule, RouterLink, LucideEye, LucideEyeOff],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <form (ngSubmit)="onSubmit()" class="tactile-card w-full max-w-md p-6 sm:p-8 space-y-5">
        <div class="text-center">
          <h1 class="font-display text-3xl font-black text-slate-900">Đặt lại mật khẩu</h1>
          <p class="mt-2 text-sm text-slate-500">
            {{ statusText() }}
          </p>
        </div>

        @if (isCheckingToken()) {
          <p class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
            Đang xác thực liên kết đặt lại mật khẩu...
          </p>
        } @else if (isTokenValid()) {
          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu mới</label>
            <div class="relative">
              <input
                [type]="showNewPassword() ? 'text' : 'password'"
                [(ngModel)]="newPassword"
                (ngModelChange)="onNewPasswordChange()"
                name="newPassword"
                placeholder="Tối thiểu 6 ký tự"
                class="tactile-input w-full text-sm font-semibold pr-12"
              />
              <button
                (click)="showNewPassword.set(!showNewPassword())"
                type="button"
                [attr.aria-label]="showNewPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-duo-blue"
              >
                @if (showNewPassword()) {
                  <svg lucideEyeOff class="h-5 w-5"></svg>
                } @else {
                  <svg lucideEye class="h-5 w-5"></svg>
                }
              </button>
            </div>
            @if (newPasswordError()) {
              <span class="text-xs font-bold text-duo-red mt-1 block">{{ newPasswordError() }}</span>
            }
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Nhập lại mật khẩu</label>
            <div class="relative">
              <input
                [type]="showConfirmPassword() ? 'text' : 'password'"
                [(ngModel)]="confirmPassword"
                (ngModelChange)="onConfirmPasswordChange()"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu mới"
                class="tactile-input w-full text-sm font-semibold pr-12"
              />
              <button
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                type="button"
                [attr.aria-label]="showConfirmPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-duo-blue"
              >
                @if (showConfirmPassword()) {
                  <svg lucideEyeOff class="h-5 w-5"></svg>
                } @else {
                  <svg lucideEye class="h-5 w-5"></svg>
                }
              </button>
            </div>
            @if (confirmPasswordError()) {
              <span class="text-xs font-bold text-duo-red mt-1 block">{{ confirmPasswordError() }}</span>
            }
          </div>

          <button type="submit" [disabled]="isSubmitting() || !!newPasswordError() || !!confirmPasswordError()"
                  class="tactile-button-green w-full py-3 rounded-2xl font-extrabold uppercase disabled:opacity-60">
            {{ isSubmitting() ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}
          </button>
        }

        @if (errorMessage()) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
            {{ errorMessage() }}
          </p>
        }

        <a routerLink="/auth/login" class="block text-center text-sm font-bold text-duo-blue hover:underline">
          Quay lại đăng nhập
        </a>
      </form>
    </div>
  `,
})
export class ResetPasswordPage implements OnInit {
  newPassword = '';
  confirmPassword = '';
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  newPasswordError = signal('');
  confirmPasswordError = signal('');
  isSubmitting = signal(false);
  isCheckingToken = signal(true);
  isTokenValid = signal(false);
  errorMessage = signal('');

  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private token = '';

  ngOnInit(): void {
    this.token = this.resolveToken();
    void this.validateToken();
  }

  statusText(): string {
    if (this.isCheckingToken()) return 'Vui lòng chờ trong khi EduMatch kiểm tra liên kết của bạn.';
    return this.isTokenValid()
      ? 'Tạo mật khẩu mới cho tài khoản của bạn.'
      : 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';
  }

  onNewPasswordChange(): void {
    if (this.newPassword && this.newPassword.length < 6) {
      this.newPasswordError.set('Mật khẩu mới phải có ít nhất 6 ký tự.');
    } else {
      this.newPasswordError.set('');
    }

    if (this.confirmPassword && this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError.set('Mật khẩu nhập lại không khớp.');
    } else {
      this.confirmPasswordError.set('');
    }
  }

  onConfirmPasswordChange(): void {
    if (this.confirmPassword && this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError.set('Mật khẩu nhập lại không khớp.');
    } else {
      this.confirmPasswordError.set('');
    }
  }

  async onSubmit(): Promise<void> {
    this.newPasswordError.set('');
    this.confirmPasswordError.set('');

    let isValid = true;
    if (this.newPassword.length < 6) {
      this.newPasswordError.set('Mật khẩu mới phải có ít nhất 6 ký tự.');
      isValid = false;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError.set('Mật khẩu nhập lại không khớp.');
      isValid = false;
    }

    if (!isValid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      await firstValueFrom(
        this.authApi.resetPassword({
          token: this.token,
          newPassword: this.newPassword,
        }),
      );
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không đặt lại được mật khẩu.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async validateToken(): Promise<void> {
    if (!this.token) {
      this.isCheckingToken.set(false);
      this.errorMessage.set('Thiếu token đặt lại mật khẩu.');
      return;
    }

    try {
      const response = await firstValueFrom(this.authApi.validateResetToken(this.token));
      this.isTokenValid.set(Boolean(response.data?.isValid));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không xác thực được token.'));
    } finally {
      this.isCheckingToken.set(false);
    }
  }

  private resolveToken(): string {
    const token =
      this.route.snapshot.queryParamMap.get('token') ??
      this.route.snapshot.queryParamMap.get('code') ??
      this.route.snapshot.paramMap.get('token') ??
      '';

    return token.trim().replaceAll(' ', '+');
  }
}
