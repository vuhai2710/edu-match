import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password-page',
  imports: [RouterLink],
  template: `
    <section class="card p-8">
      <p class="eyebrow">Auth route</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-950">Quên mật khẩu</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
        Placeholder for <code>POST /api/Auth/forgot-password</code>. The backend already applies
        rate limiting and sends reset links that return to the frontend reset route.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a class="btn-primary" routerLink="/auth/reset-password">Đi tới reset mật khẩu</a>
        <a class="btn-secondary" routerLink="/auth/login">Quay lại đăng nhập</a>
      </div>
    </section>
  `,
})
export class ForgotPasswordPage {}
