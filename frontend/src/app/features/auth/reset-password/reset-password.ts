import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '../../../api/facades/auth-api';
import { getApiErrorMessage } from '../../../core/http/api-error';

@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <section class="tactile-card w-full max-w-md p-6 sm:p-8 space-y-5">
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
            <input type="password" [(ngModel)]="newPassword" class="tactile-input w-full text-sm font-semibold" />
          </div>
          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Nhập lại mật khẩu</label>
            <input type="password" [(ngModel)]="confirmPassword" class="tactile-input w-full text-sm font-semibold" />
          </div>

          <button (click)="onSubmit()" [disabled]="isSubmitting()"
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
      </section>
    </div>
  `,
})
export class ResetPasswordPage implements OnInit {
  newPassword = '';
  confirmPassword = '';
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

  async onSubmit(): Promise<void> {
    if (this.newPassword.length < 8) {
      this.errorMessage.set('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Mật khẩu xác nhận không khớp.');
      return;
    }

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
