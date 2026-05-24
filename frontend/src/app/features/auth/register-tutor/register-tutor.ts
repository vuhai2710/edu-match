import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-tutor-page',
  imports: [RouterLink],
  template: `
    <section class="card p-8">
      <p class="eyebrow">Auth route</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-950">Đăng ký gia sư</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
        Placeholder for the tutor onboarding flow. The backend already exposes
        <code>POST /api/Auth/register/tutor</code> with multipart form data for CV and profile
        information.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a class="btn-primary" routerLink="/auth/login">Đăng nhập</a>
        <a class="btn-secondary" routerLink="/tutor/dashboard">Xem dashboard mẫu</a>
      </div>
    </section>
  `,
})
export class RegisterTutorPage {}
