import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <section class="grid gap-6">
      <div class="card-muted overflow-hidden p-8 md:p-10">
        <p class="eyebrow">EduMatch frontend foundation</p>
        <h1 class="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          Angular 21 workspace ready for public, auth, student, tutor, and admin.
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          The frontend is scaffolded as a standalone Angular SPA with Tailwind, lazy
          routes, environment-driven API wiring, and session primitives aligned to the
          current .NET backend.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a class="btn-primary" routerLink="/auth/login">Đăng nhập</a>
          <a class="btn-secondary" routerLink="/auth/register/student">Đăng ký học viên</a>
          <a class="btn-secondary" routerLink="/auth/register/tutor">Đăng ký gia sư</a>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="card p-6">
          <p class="eyebrow">Public</p>
          <h2 class="mt-2 text-xl font-semibold text-slate-950">Landing and payment callbacks</h2>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Includes the root route plus success and cancel placeholders for the PayOS
            callback flow already configured in backend development settings.
          </p>
        </article>

        <article class="card p-6">
          <p class="eyebrow">Core auth</p>
          <h2 class="mt-2 text-xl font-semibold text-slate-950">Session, guards, bootstrap</h2>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Session state is persisted in localStorage behind a dedicated service with
            <code>AuthInterceptor</code>, <code>AuthGuard</code>, and <code>RoleGuard</code>.
          </p>
        </article>

        <article class="card p-6">
          <p class="eyebrow">API</p>
          <h2 class="mt-2 text-xl font-semibold text-slate-950">Swagger generation pipeline</h2>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            <code>npm run api:generate</code> fetches Swagger from the backend and regenerates the
            Angular-friendly typed client into <code>src/app/api/generated/client</code>.
          </p>
        </article>
      </div>
    </section>
  `,
})
export class HomePage {}
