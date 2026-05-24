import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-student-page',
  imports: [RouterLink],
  template: `
    <section class="card p-8">
      <p class="eyebrow">Auth route</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-950">Đăng ký học viên</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
        Placeholder for the student registration journey. The backend currently expects
        multipart form data at <code>POST /api/Auth/register/student</code>.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a class="btn-primary" routerLink="/auth/login">Đã có tài khoản</a>
        <a class="btn-secondary" routerLink="/">Xem tổng quan dự án</a>
      </div>
    </section>
  `,
})
export class RegisterStudentPage {}
