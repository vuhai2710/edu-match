import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink],
  template: `
    <section class="card p-8">
      <p class="eyebrow">Auth route</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-950">Đăng nhập</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
        This placeholder is wired to the <code>AuthApiService.login()</code> contract and ready
        for reactive form implementation in the next slice.
      </p>

      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <div class="rounded-3xl border border-slate-200 bg-white p-5">
          <p class="text-sm font-medium text-slate-500">Backend endpoint</p>
          <p class="mt-2 font-mono text-sm text-slate-900">POST /api/Auth/login</p>
        </div>
        <div class="rounded-3xl border border-slate-200 bg-white p-5">
          <p class="text-sm font-medium text-slate-500">Session behavior</p>
          <p class="mt-2 text-sm text-slate-700">
            Access token, refresh token, and current user are stored through
            <code>SessionService</code>.
          </p>
        </div>
      </div>

      <div class="mt-8 flex flex-wrap gap-3">
        <a class="btn-secondary" routerLink="/auth/forgot-password">Quên mật khẩu</a>
        <a class="btn-secondary" routerLink="/auth/register/student">Đăng ký học viên</a>
        <a class="btn-secondary" routerLink="/auth/register/tutor">Đăng ký gia sư</a>
      </div>
    </section>
  `,
})
export class LoginPage {}
