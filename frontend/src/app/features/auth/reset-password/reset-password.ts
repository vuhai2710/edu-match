import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password-page',
  imports: [RouterLink],
  template: `
    <section class="card p-8">
      <p class="eyebrow">Auth route</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-950">Đặt lại mật khẩu</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
        Placeholder for reset password token validation and password submission. This
        route matches the backend development config path <code>/auth/reset-password</code>.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a class="btn-primary" routerLink="/auth/login">Quay lại đăng nhập</a>
        <a class="btn-secondary" routerLink="/auth/forgot-password">Yêu cầu link mới</a>
      </div>
    </section>
  `,
})
export class ResetPasswordPage {}
