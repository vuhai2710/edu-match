import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '../../../api/facades/auth-api';
import { getApiErrorMessage } from '../../../core/http/api-error';

@Component({
  selector: 'app-forgot-password-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <form (ngSubmit)="onSubmit()" class="tactile-card w-full max-w-md p-6 sm:p-8 space-y-5">
        <div class="text-center">
          <h1 class="font-display text-3xl font-black text-slate-900">Quên mật khẩu</h1>
          <p class="mt-2 text-sm text-slate-500">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
        </div>

        <div>
          <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Email</label>
          <input type="email" [(ngModel)]="email" name="email" class="tactile-input w-full text-sm font-semibold" />
          @if (emailError()) {
            <span class="text-xs font-bold text-duo-red mt-1 block text-center">{{ emailError() }}</span>
          }
        </div>

        <button type="submit" [disabled]="isSubmitting()"
                class="tactile-button-green w-full py-3 rounded-2xl font-extrabold uppercase disabled:opacity-60">
          {{ isSubmitting() ? 'Đang gửi...' : 'Gửi liên kết' }}
        </button>

        @if (message()) {
          <p class="rounded-xl border-2 border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 text-center">
            {{ message() }}
          </p>
        }
        @if (errorMessage()) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red text-center">
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
export class ForgotPasswordPage {
  email = '';
  isSubmitting = signal(false);
  message = signal('');
  errorMessage = signal('');
  emailError = signal('');

  private readonly authApi = inject(AuthApiService);

  async onSubmit(): Promise<void> {
    this.emailError.set('');
    this.errorMessage.set('');
    this.message.set('');

    if (!this.email.trim()) {
      this.emailError.set('Vui lòng nhập email.');
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.email.trim())) {
      this.emailError.set('Email không đúng định dạng.');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const res = await firstValueFrom(this.authApi.forgotPassword({ email: this.email.trim() }));
      this.message.set(res.message || 'Link đặt lại mật khẩu đã được gửi.');
    } catch (error) {
      const errMsg = getApiErrorMessage(error, 'Không gửi được yêu cầu.');
      this.errorMessage.set(errMsg);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
