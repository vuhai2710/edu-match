import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard-page',
  template: `
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="card p-6">
        <p class="eyebrow">Admin</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Dashboard shell</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Ready for high-level system metrics from <code>GET /api/Dashboard/admin</code>.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Moderation</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The backend already includes admin flows for applications, requests, classes,
          payments, and cancellation handling.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Generated API</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Admin modules are expected to consume generated clients first because they are
          CRUD-heavy and map cleanly from Swagger.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Auditability</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Central route guards and session bootstrap keep the admin surface behind the
          same auth contract as the rest of the app.
        </p>
      </article>
    </section>
  `,
})
export class AdminDashboardPage {}
